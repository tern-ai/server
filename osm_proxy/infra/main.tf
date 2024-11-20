provider "aws" {
  region = "us-east-1"
}

resource "aws_instance" "osm_proxy" {
  ami           = "ami-0c55b159cbfafe1f0" # Reemplázalo con un AMI válido para tu región.
  instance_type = "t2.micro"

  tags = {
    Name = "osm-proxy-microservice"
  }

  # Inicia el script para instalar Node.js, Redis y desplegar la aplicación
  user_data = <<-EOF
    #!/bin/bash
    sudo apt-get update
    sudo apt-get install -y nodejs npm redis-server
    curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Clonar el repositorio
    git clone <repository-url> /home/ubuntu/osm-proxy-microservice
    cd /home/ubuntu/osm-proxy-microservice

    # Instalar dependencias y compilar el proyecto
    npm install
    npx tsc

    # Iniciar Redis
    sudo systemctl start redis-server

    # Iniciar la aplicación
    node dist/index.js &
  EOF
}

resource "aws_security_group" "osm_proxy_sg" {
  name        = "osm_proxy_sg"
  description = "Allow inbound HTTP traffic"

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "osm_proxy" {
  ami                         = "ami-0c55b159cbfafe1f0" # Reemplaza esto por un AMI válido
  instance_type               = "t2.micro"
  vpc_security_group_ids      = [aws_security_group.osm_proxy_sg.id]
  associate_public_ip_address = true

  tags = {
    Name = "osm-proxy-microservice"
  }

  user_data = <<-EOF
    #!/bin/bash
    sudo apt-get update
    sudo apt-get install -y nodejs npm redis-server
    npm install -g pm2

    # Descargar la aplicación desde un repositorio
    git clone <repository-url> /home/ubuntu/osm-proxy-microservice
    cd /home/ubuntu/osm-proxy-microservice

    # Instalar dependencias y compilar
    npm install
    npx tsc

    # Iniciar Redis
    sudo systemctl start redis-server

    # Ejecutar la aplicación con PM2
    pm2 start dist/index.js
  EOF
}
