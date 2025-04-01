# AWS Server Management Chatbot

A modern web application for managing AWS EC2 instances through natural language commands. This project provides a user-friendly interface to interact with AWS resources using a chatbot interface.

## Features

- Natural language processing for AWS commands
- Real-time EC2 instance monitoring
- Instance management (start, stop, reboot)
- Resource tagging and organization
- CloudWatch metrics integration
- Modern React frontend with Chakra UI
- Secure AWS credential management
- Comprehensive error handling
- Automated testing

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
