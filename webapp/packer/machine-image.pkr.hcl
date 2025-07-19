packer {
  required_plugins {
    amazon = {
      version = ">= 1.0.0, < 2.0.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

## AWS Variables
variable "aws_region" {
  type    = string
  default = "us-east-2"
}

variable "source_ami" {
  type    = string
  default = "ami-12345"
}

variable "ssh_username" {
  type    = string
  default = "defualt-user"
}

variable "subnet_id" {
  type    = string
  default = "subnet-12345"
}

/////////


# GCP Variables
# variable "gcp_project_id_dev" {
#   type = string
# }


# variable "gcp_project_id_demo" {
#   type = string
# }

# variable "gcp_zone" {
#   type    = string
#   default = "us-central1-a"
# }

# variable "gcp_image_name" {
#   type    = string
#   default = "webapp-image"
# }
/////////


# Database Variables
variable "db_password" {
  type    = string
  default = "default"
}

variable "db_name" {
  type    = string
  default = "default"

}

# AWS AMI Builder
source "amazon-ebs" "aws_image" {
  region          = var.aws_region
  ami_name        = "10_csye6225_spring_2025_app_${formatdate("YYYY_MM_DD_HH-mm", timestamp())}"
  ami_description = "AMI for CSYE 6225 Spring 2025"
  instance_type   = "t2.small"
  source_ami      = var.source_ami
  ssh_username    = var.ssh_username
  ami_users       = ["861276095817", "545009863149"]

  launch_block_device_mappings {
    delete_on_termination = true
    device_name           = "/dev/sda1"
    volume_size           = 8
    volume_type           = "gp2"
  }
}

# # GCP Image Builder
# source "googlecompute" "gcp_image" {
#   project_id              = var.gcp_project_id_dev
#   zone                    = var.gcp_zone
#   source_image_family     = "ubuntu-2204-lts"
#   source_image_project_id = ["ubuntu-os-cloud"]
#   machine_type            = "e2-medium"
#   ssh_username            = "ubuntu"

#   image_name        = "${var.gcp_image_name}-{{timestamp}}"
#   image_description = "GCP Image for CSYE 6225 Spring 2025"

#   image_labels = {
#     name        = var.gcp_image_name
#     environment = "dev"
#     application = "health-check-api"
#   }
# }

# Common Build with Provisioners for AWS & GCP
build {
  sources = [
    "source.amazon-ebs.aws_image",
    # "source.googlecompute.gcp_image"
  ]

  # Post-Processor: Copy Image from 'dev' to 'demo' Project
  # post-processor "shell-local" {
  #   only = ["googlecompute.gcp_image"] # Run only for GCP builds
  #   inline = [
  #     # Find the latest image in the 'dev' project
  #     "IMAGE_NAME=$(gcloud compute images list --project=${var.gcp_project_id_dev} --filter='name~${var.gcp_image_name}-.*' --sort-by=~creationTimestamp --limit=1 --format='value(name)')",

  #     # Ensure IMAGE_NAME is not empty before copying
  #     "[ -z \"$IMAGE_NAME\" ] && echo 'No image found to copy!' && exit 1 || echo 'Found image: $IMAGE_NAME'",

  #     # Copy the image from 'dev' to 'demo'
  #     "gcloud compute images create $IMAGE_NAME --project=${var.gcp_project_id_demo} --source-image=$IMAGE_NAME --source-image-project=${var.gcp_project_id_dev}"
  #   ]
  # }

  provisioner "shell" {
    environment_vars = [
      "DB_PASSWORD=${var.db_password}",
      "DB_NAME=${var.db_name}"
    ]
    script = "./scripts/setup.sh"
  }

  provisioner "shell" {
    script = "./scripts/cloudwatch.sh"
  }

  provisioner "shell" {
    script = "./scripts/local_user.sh"
  }

  provisioner "file" {
    source      = "../webapp-fork.zip"
    destination = "/tmp/webapp-fork.zip"
  }

  provisioner "shell" {
    script = "./scripts/run.sh"
  }

  provisioner "file" {
    source      = "./webapp.service"
    destination = "/tmp/webapp.service"
  }

  provisioner "shell" {
    script = "./scripts/systemd.sh"
  }
}