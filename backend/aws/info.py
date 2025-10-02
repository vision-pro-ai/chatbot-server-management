# aws/info.py
import boto3

def get_aws_info():
    """Return basic AWS account info."""
    try:
        sts = boto3.client('sts')
        identity = sts.get_caller_identity()

        session = boto3.session.Session()
        region = session.region_name or "ap-south-1"

        iam = boto3.client('iam')
        aliases = iam.list_account_aliases()
        account_alias = aliases["AccountAliases"][0] if aliases["AccountAliases"] else "N/A"

        print("acnt" ,identity["Account"])
        print("region" ,region)

        return {
            "account_id": identity["Account"],
            "arn": identity["Arn"],
            "region": region,
            "account_alias": account_alias
        }
    except Exception as e:
        return {"error": str(e)}
