# AWS Server Management Chatbot

A modern web application for managing AWS EC2 instances through natural language commands. This project provides a user-friendly interface to interact with AWS resources using a chatbot interface.


## [AWS Server-Management Chatbot](https://github.com/vision-pro-ai/chatbot-server-management)
Python-based chatbot designed to **manage AWS EC2 instances** and automate server tasks using **Boto3**. Enables real-time monitoring, snapshot cleanup, and efficient cloud resource management.

<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/> <img src="https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=FF9900" alt="AWS"/> <img src="https://img.shields.io/badge/Boto3-4B8BBE?style=for-the-badge&logo=python&logoColor=white" alt="Boto3"/> <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask"/> <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/> <img src="https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind"/>

![images](https://github.com/kashishver-ma/kashishver-ma/blob/main/img.jpg)

## Features
- **AWS EC2 Management**: Start, stop, and monitor EC2 instances programmatically.
- **Snapshot Automation**: Identify and delete stale EBS snapshots to optimize storage costs.
- **Real-Time Monitoring**: Fetch server status, CPU utilization, and other metrics on-demand.
- **Interactive Chatbot Interface**: User-friendly chatbot interface to trigger server actions.
- **Cloud Integration**: Fully utilizes AWS SDK (**Boto3**) for seamless interaction with cloud resources.
- **Data Export**: Generate real-time reports in **Excel** or **PDF** for audit and analysis.

## Key Learnings
- Gained hands-on experience with **AWS services** (EC2, S3, Lambda, CloudWatch).
- Learned to automate **server management tasks** using **Python and Boto3**.
- Implemented **real-time data fetching** and reporting.
- Improved understanding of **cloud resource optimization** and cost management.
- Enhanced skills in building **interactive CLI/Chatbot applications** with Python.


## Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- AWS account with appropriate permissions
- AWS CLI configured with credentials

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/server-management-chatbot.git
cd server-management-chatbot
```

2. Run the setup script:

```bash
chmod +x setup.sh
./setup.sh
```

3. Update the `.env` file with your AWS credentials:

```bash
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_DEFAULT_REGION=us-east-1
FLASK_ENV=development
FLASK_APP=backend/app.py
```

## Running the Application

1. Start the backend server:

```bash
source venv/bin/activate
python backend/app.py
```

2. In a new terminal, start the frontend:

```bash
cd frontend
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
server-management-chatbot/
├── README.md
├── requirements.txt
├── setup.sh
├── .gitignore
├── .pylintrc
├── .eslintrc.json
├── docs/
│   ├── project_scope.md
│   ├── architecture.md
│   ├── api_design.md
│   ├── aws_configuration.md
│   └── ec2_setup.md
├── backend/
│   ├── __init__.py
│   ├── app.py
│   ├── config.py
│   ├── aws/
│   │   ├── __init__.py
│   │   ├── ec2.py
│   │   ├── ebs.py
│   │   └── monitoring.py
│   └── nlp/
│       ├── __init__.py
│       ├── intent_classifier.py
│       └── entity_extractor.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── App.js
│   └── package.json
└── tests/
    ├── __init__.py
    ├── test_ec2.py
    ├── test_ebs.py
    └── test_nlp.py
```

## Available Commands

The chatbot supports the following natural language commands:

- Start/Launch/Boot instance
- Stop/Shutdown/Terminate instance
- Reboot/Restart instance
- Check/Fetch/Get metrics
- Tag/Label instance
- Decommission/Remove instance
- List/Show instances

## Development

### Running Tests

```bash
# Activate virtual environment
source venv/bin/activate

# Run Python tests
python -m pytest tests/

# Run frontend tests
cd frontend
npm test
```

### Code Style

The project uses:

- Black for Python code formatting
- ESLint for JavaScript/React code formatting
- Pylint for Python code linting

### Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Security

- AWS credentials are stored in environment variables
- CORS is configured for secure cross-origin requests
- Input validation and sanitization
- Error handling and logging
- Secure AWS IAM roles and policies

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- AWS SDK for Python (Boto3)
- Flask web framework
- React and Chakra UI
- Natural Language Processing libraries
