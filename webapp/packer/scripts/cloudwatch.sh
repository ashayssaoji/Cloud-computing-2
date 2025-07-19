#!/bin/bash

echo "Starting CloudWatch Agent installation..."

# Update package lists
echo "Updating package lists..."
sudo apt-get update -y || { echo "Failed to update package lists"; exit 1; }

# Install AWS CloudWatch Agent
echo "Downloading CloudWatch Agent..."
cd /tmp
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb || { echo "Download failed"; exit 1; }

echo "Installing CloudWatch Agent..."
sudo dpkg -i amazon-cloudwatch-agent.deb || { echo "Install failed"; exit 1; }
rm -f amazon-cloudwatch-agent.deb

# Ensure necessary directories exist
echo "Ensuring required directories exist..."
sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc/
sudo mkdir -p /opt/webapp

# Create CloudWatch config file
echo "Creating CloudWatch config file..."
sudo tee /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json > /dev/null << EOF
{
  "agent": {
    "metrics_collection_interval": 10,
    "run_as_user": "cwagent"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/opt/webapp/webapp.log",
            "log_group_name": "webapp-logs",
            "log_stream_name": "packer-instance",
            "timestamp_format": "%Y-%m-%d %H:%M:%S"
          },
          {
            "file_path": "/var/log/syslog",
            "log_group_name": "system-logs",
            "log_stream_name": "packer-instance",
            "timestamp_format": "%b %d %H:%M:%S"
          }
        ]
      }
    }
  },
  "metrics": {
    "append_dimensions": {
      "InstanceId": "packer-instance"
    },
    "aggregation_dimensions": [["InstanceId"]],
    "metrics_collected": {
      "cpu": {
        "measurement": ["usage_idle", "usage_user", "usage_system"],
        "metrics_collection_interval": 10
      },
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 10
      }
    }
  }
}
EOF

# Lock config file
echo "Locking CloudWatch config file..."
sudo chown root:root /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
sudo chmod 444 /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Create webapp log file
echo "Creating webapp log file..."
sudo touch /opt/webapp/webapp.log
sudo chmod 664 /opt/webapp/webapp.log
sudo chown cwagent:cwagent /opt/webapp/webapp.log

# Start and enable CloudWatch Agent
echo "Starting CloudWatch Agent with config..."
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
  -s || { echo "Agent configuration failed"; exit 1; }

echo "Enabling CloudWatch Agent to start on boot..."
sudo systemctl enable amazon-cloudwatch-agent
sudo systemctl restart amazon-cloudwatch-agent

echo "CloudWatch Agent setup completed successfully."
