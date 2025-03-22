#!/bin/bash

echo "Setting up development environment..."

# Check if pip is installed
if ! command -v pip &> /dev/null; then
    echo "pip is not installed. Installing pip..."
    curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
    python get-pip.py
    rm get-pip.py
fi

# Update package manager
echo "Updating pip..."
pip install --upgrade pip

# Create and activate virtual environment
echo "Setting up virtual environment..."
python -m venv venv
source venv/bin/activate

# Install AWS CLI
echo "Installing AWS CLI..."
pip install awscli

# Install core development packages
echo "Installing core development packages..."
pip install boto3 flask pytest pytest-cov moto

# Install NLP packages
echo "Installing NLP packages..."
pip install transformers torch

# Configure AWS CLI with placeholder credentials
echo "Configuring AWS CLI with placeholder credentials..."
mkdir -p ~/.aws
echo "[default]" > ~/.aws/credentials
echo "aws_access_key_id = YOUR_ACCESS_KEY" >> ~/.aws/credentials
echo "aws_secret_access_key = YOUR_SECRET_KEY" >> ~/.aws/credentials
echo "region = us-east-1" >> ~/.aws/credentials

# Install linting tools
echo "Installing linting tools..."
pip install pylint black
npm install -g eslint eslint-config-airbnb-base eslint-plugin-import

# Create requirements.txt file
echo "Creating requirements.txt file..."
cat > requirements.txt << EOL
boto3==1.28.38
flask==2.3.3
pytest==7.4.0
pytest-cov==4.1.0
moto==4.2.0
transformers==4.33.1
torch==2.0.1
pylint==2.17.5
black==23.7.0
EOL

echo "Setup complete! Please update your AWS credentials."