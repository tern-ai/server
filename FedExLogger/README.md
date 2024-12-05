# AWS EC2 Log Ingestion and S3 Storage Setup

This repository provides a reference implementation for receiving sensor log data (e.g., from the FedEx Logger or a Proprio) over HTTP and securely storing that data in an Amazon S3 bucket. It outlines how to set up and configure an AWS EC2 instance running a Flask application behind Nginx and Gunicorn, handle inbound POST requests containing log data, and store that data in S3.

## Table of Contents

- [AWS EC2 Log Ingestion and S3 Storage Setup](#aws-ec2-log-ingestion-and-s3-storage-setup)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Prerequisites](#prerequisites)
  - [Setup Steps](#setup-steps)
    - [1. Launching and Configuring the EC2 Instance](#1-launching-and-configuring-the-ec2-instance)
    - [2. Setting Up IAM Roles and S3 Bucket](#2-setting-up-iam-roles-and-s3-bucket)
    - [3. Installing Dependencies on the EC2 Instance](#3-installing-dependencies-on-the-ec2-instance)
    - [4. Configuring and Running the Flask Application](#4-configuring-and-running-the-flask-application)
    - [5. Setting Up Gunicorn and Nginx](#5-setting-up-gunicorn-and-nginx)
    - [6. Verifying the Setup Locally and Externally](#6-verifying-the-setup-locally-and-externally)
    - [7. Updating and Testing the ESP32 Device Code](#7-updating-and-testing-the-esp32-device-code)
  - [Data Flow Verification](#data-flow-verification)
  - [Security Group and Firewall Considerations](#security-group-and-firewall-considerations)
  - [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)
  - [TODO](#todo)

---

## Overview

This setup allows the FedEx logger or any future Proprio (PCB version) to send sensor or log data to a backend application hosted on AWS. The data is received by a Flask-based web server, fronted by Nginx and managed by Gunicorn on an Amazon EC2 instance, and is then stored in an Amazon S3 bucket for  analysis.

Flow:
- Logger → EC2: Periodic HTTP POST requests from an ESP32 send decoded sensor logs.
- EC2 → S3: Received log data is stored in Amazon S3 for long-term retention.

---

## Prerequisites

1. **AWS Account** with permissions to create/modify EC2 instances, IAM roles, and S3 buckets.
2. **EC2 Key Pair File (.pem)** to SSH into the EC2 instance.
3. **S3 Bucket** for storing log files.
4. **ESP32 Toolchain** (Arduino IDE or PlatformIO) for uploading code to your device.
5. **Wi-Fi and Time Sync**: Ensure the ESP32 can connect to Wi-Fi and has accurate time if needed. I use GPS time with calculated milliseconds using the ESP32's millis.

---

## Setup Steps

### 1. Launching and Configuring the EC2 Instance

- Using the **Amazon Linux 2 AMI** image.
- Small instance type `t2.micro`.
- Create/select a **key pair** and download the `.pem` file.
- Assign a **Security Group** with inbound rules for:
  - SSH (port 22)
  - HTTP (port 80)
- Launch the instance and note its **Public DNS** (for us, `ec2-18-218-0-48.us-east-2.compute.amazonaws.com`).
- **NOTE! Stopping the instance and restarting it may change the public DNS. This REQUIRES a reflash of the Proprio/Logger with the new address**

### 2. Setting Up IAM Roles and S3 Bucket

- Created an S3 bucket, `fedex-can-bus-logger`.
- Create an IAM role for EC2 with `s3:PutObject` permission to the bucket.
- Attach the IAM role to the EC2 instance.

### 3. Installing Dependencies on the EC2 Instance

SSH into the instance:
    
    ssh -i "MatthewFedExLogServerKey.pem" ec2-user@ec2-18-218-0-48.us-east-2.compute.amazonaws.com

Update and install necessary packages:
    
    sudo yum update -y
    sudo yum install -y python3 python3-pip git

Install Flask, Boto3, and Gunicorn:
    
    sudo pip3 install flask boto3 gunicorn

### 4. Configuring and Running the Flask Application

- Update `server.py` (if needed).
- Test the Flask application:

      sudo python3 server.py

  In a separate terminal, run:
    
      curl -X POST http://localhost/upload?device_id=test_device -d "Test log data"

  Expected: `Log uploaded successfully`

  Press `Ctrl+C` to stop the Flask app.

### 5. Setting Up Gunicorn and Nginx

- Run Gunicorn manually for testing:
    
      gunicorn --bind 127.0.0.1:8000 wsgi:app

- Create a systemd service at `/etc/systemd/system/esp32_server.service`:
    
      [Unit]
      Description=Gunicorn instance to serve ESP32 Server
      After=network.target

      [Service]
      User=ec2-user
      Group=nginx
      WorkingDirectory=/home/ec2-user/repo
      Environment="PATH=/usr/local/bin:/usr/bin"
      ExecStart=/usr/local/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 wsgi:app

      [Install]
      WantedBy=multi-user.target

  Start and enable the service:
    
      sudo systemctl start esp32_server
      sudo systemctl enable esp32_server

- Install and configure Nginx:
    
      sudo amazon-linux-extras install nginx1 -y
      sudo systemctl start nginx
      sudo systemctl enable nginx

- Create Nginx config `/etc/nginx/conf.d/esp32_server.conf`:
    
      server {
          listen 80;
          server_name ec2-18-218-0-48.us-east-2.compute.amazonaws.com;

          location / {
              proxy_pass http://127.0.0.1:8000;
              include proxy_params;
              proxy_redirect off;
          }
      }

- Test and reload Nginx:
    
      sudo nginx -t
      sudo systemctl reload nginx

### 6. Verifying the Setup Locally and Externally

- Local test on EC2:
    
      curl -X POST http://localhost/upload?device_id=test_device -d "Local test data"

  Expected: `Log uploaded successfully`

- External test from your machine:
    
      curl -X POST http://ec2-18-218-0-48.us-east-2.compute.amazonaws.com/upload?device_id=test_device -d "External test data"

  Expected: `Log uploaded successfully`

Check S3 to confirm logs are stored.

### 7. Updating and Testing the ESP32 Device Code

Sample ESP32 code:

    #include <WiFi.h>
    #include <HTTPClient.h>

    const char* ssid = "WiFiSSID or SIM Hotspot SSID";
    const char* password = "Password";

    const char* serverName = "http://ec2-18-218-0-48.us-east-2.compute.amazonaws.com/upload";
    const char* device_id = "ProprioTest";

    void setup() {
      Serial.begin(115200);
      WiFi.begin(ssid, password);
      while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.print(".");
      }
      Serial.println("\nConnected to Wi-Fi");
    }

    void loop() {
      if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        String serverPath = String(serverName) + "?device_id=" + device_id;
        http.begin(serverPath.c_str());
        http.addHeader("Content-Type", "text/plain");
        String logData = "Testing log from Proprio";
        int httpResponseCode = http.POST(logData);
        if (httpResponseCode > 0) {
          Serial.print("HTTP Response code: ");
          Serial.println(httpResponseCode);
          Serial.print("Response from server: ");
          Serial.println(http.getString());
        } else {
          Serial.print("Error on sending POST: ");
          Serial.println(httpResponseCode);
        }
        http.end();
      } else {
        Serial.println("Wi-Fi not connected");
      }
      delay(60000);
    }

Upload this code to the Proprio and open the Serial Monitor to verify logs are being sent successfully.

---

## Data Flow Verification

1. Confirm that the ESP32 logs show `HTTP Response code: 200` and `Log uploaded successfully`.
2. Validate that S3 has new log files in the specified directory (`logs/{device_id}/`).
3. If needed, adjust polling intervals or batch size in the ESP32 code.

---

## Security Group and Firewall Considerations

- Ensure inbound rules allow HTTP (port 80) and SSH (port 22).
- We need to enable restricting inbound traffic more tightly and use HTTPS for future deployment.

---

## Common Issues and Troubleshooting

- **SSH Warnings**: If you see a "REMOTE HOST IDENTIFICATION HAS CHANGED" message, remove the old host key from `~/.ssh/known_hosts`.
- **Permission Denied (Publickey)**: Check `.pem` file permissions (use `chmod 400`).
- **Nginx or Gunicorn Errors**: Check logs:
  
      sudo journalctl -u esp32_server
      sudo tail -f /var/log/nginx/error.log

- **No Data in S3**: Confirm IAM role, S3 permissions, and bucket name.

---

## TODO

- **HTTPS / TLS**: Secure communication using SSL certificates and `certbot`.
- **Authentication**: Add API keys or tokens for device authentication. We need to discuss best method for larger deployment
- **Monitoring and Observability**: Integrate CloudWatch for logs and metrics.

---
