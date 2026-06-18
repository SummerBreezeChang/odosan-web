# AWS Aurora Postgres setup for Odosan

Provisions Aurora Serverless v2 in `us-west-1`, fronted by RDS Proxy so Vercel
Fluid Compute functions reuse pooled connections instead of opening one TCP+TLS
session per request. Credentials live in Secrets Manager.

> Prerequisite: `aws` CLI installed and configured (`aws configure`) with
> credentials that can create RDS, EC2 (security groups), IAM, and Secrets
> Manager resources.

## 0. Variables — edit and `source` once

```bash
export AWS_REGION=us-west-1
export AWS_DEFAULT_REGION=$AWS_REGION
export CLUSTER_ID=odosan-aurora
export DB_NAME=odosan
export DB_USER=app
export DB_PASS="$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-24)"
export PROXY_NAME=odosan-proxy
export SECRET_NAME=odosan/db/app
export SG_NAME=odosan-aurora-sg
```

Note `$DB_PASS` for later — Secrets Manager will hold the canonical copy.

## 1. Default VPC + a security group that allows Postgres from itself

```bash
VPC_ID=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true \
  --query 'Vpcs[0].VpcId' --output text)

SUBNET_IDS=$(aws ec2 describe-subnets --filters Name=vpc-id,Values=$VPC_ID \
  --query 'Subnets[].SubnetId' --output text)

SG_ID=$(aws ec2 create-security-group --group-name $SG_NAME \
  --description "Odosan Aurora + RDS Proxy" --vpc-id $VPC_ID \
  --query 'GroupId' --output text)

# Allow Postgres ingress from anything in this SG (Proxy ↔ Aurora)
aws ec2 authorize-security-group-ingress --group-id $SG_ID \
  --protocol tcp --port 5432 --source-group $SG_ID

# Allow Vercel egress to reach the Proxy from the public internet.
# Lock this down later: use Vercel's published IP ranges, or put the Proxy
# in a private subnet behind a NAT and use a VPC peering / Tailscale setup.
aws ec2 authorize-security-group-ingress --group-id $SG_ID \
  --protocol tcp --port 5432 --cidr 0.0.0.0/0
```

## 2. DB subnet group (uses default VPC subnets)

```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name odosan-subnets \
  --db-subnet-group-description "Odosan Aurora subnets" \
  --subnet-ids $SUBNET_IDS
```

## 3. Aurora Postgres Serverless v2 cluster

```bash
aws rds create-db-cluster \
  --db-cluster-identifier $CLUSTER_ID \
  --engine aurora-postgresql \
  --engine-version 16.4 \
  --database-name $DB_NAME \
  --master-username $DB_USER \
  --master-user-password "$DB_PASS" \
  --vpc-security-group-ids $SG_ID \
  --db-subnet-group-name odosan-subnets \
  --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=4 \
  --enable-http-endpoint \
  --storage-encrypted

# One writer instance (Serverless v2 sizes itself within the scaling config)
aws rds create-db-instance \
  --db-instance-identifier ${CLUSTER_ID}-writer \
  --db-cluster-identifier $CLUSTER_ID \
  --engine aurora-postgresql \
  --db-instance-class db.serverless

# Wait for cluster to be available (~5-10 min)
aws rds wait db-instance-available \
  --db-instance-identifier ${CLUSTER_ID}-writer
```

## 4. Store credentials in Secrets Manager (RDS Proxy needs this format)

```bash
SECRET_ARN=$(aws secretsmanager create-secret \
  --name $SECRET_NAME \
  --secret-string "{\"username\":\"$DB_USER\",\"password\":\"$DB_PASS\"}" \
  --query ARN --output text)
```

## 5. IAM role RDS Proxy will assume to read the secret

```bash
cat > /tmp/proxy-trust.json <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "rds.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
JSON

ROLE_ARN=$(aws iam create-role --role-name OdosanProxyRole \
  --assume-role-policy-document file:///tmp/proxy-trust.json \
  --query 'Role.Arn' --output text)

cat > /tmp/proxy-policy.json <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["secretsmanager:GetSecretValue"],
    "Resource": "$SECRET_ARN"
  }]
}
JSON

aws iam put-role-policy --role-name OdosanProxyRole \
  --policy-name SecretsRead --policy-document file:///tmp/proxy-policy.json
```

## 6. Create the RDS Proxy

```bash
aws rds create-db-proxy \
  --db-proxy-name $PROXY_NAME \
  --engine-family POSTGRESQL \
  --auth "AuthScheme=SECRETS,SecretArn=$SECRET_ARN,IAMAuth=DISABLED" \
  --role-arn $ROLE_ARN \
  --vpc-subnet-ids $SUBNET_IDS \
  --vpc-security-group-ids $SG_ID \
  --require-tls

aws rds wait db-proxy-available --db-proxy-name $PROXY_NAME

# Register the Aurora cluster as the Proxy's target
aws rds register-db-proxy-targets \
  --db-proxy-name $PROXY_NAME \
  --db-cluster-identifiers $CLUSTER_ID
```

## 7. Grab the connection string

```bash
PROXY_ENDPOINT=$(aws rds describe-db-proxies --db-proxy-name $PROXY_NAME \
  --query 'DBProxies[0].Endpoint' --output text)

# This is what goes in DATABASE_URL — both .env.local and Vercel.
echo "postgres://$DB_USER:$DB_PASS@$PROXY_ENDPOINT:5432/$DB_NAME?sslmode=require"
```

## 8. Apply schema + seed

```bash
DATABASE_URL="postgres://$DB_USER:$DB_PASS@$PROXY_ENDPOINT:5432/$DB_NAME?sslmode=require"

# Apply schema
psql "$DATABASE_URL" -f apps/web/db/schema.sql

# Seed providers (start the dev server first, then hit it)
curl -X POST http://localhost:4000/api/seed-providers
```

## 9. Push to Vercel

```bash
vercel env add DATABASE_URL production   # paste the URL when prompted
vercel env add DATABASE_URL preview
vercel env add DATABASE_URL development
```

## Cleanup (if you tear down)

```bash
aws rds delete-db-proxy --db-proxy-name $PROXY_NAME
aws rds delete-db-instance --db-instance-identifier ${CLUSTER_ID}-writer --skip-final-snapshot
aws rds delete-db-cluster --db-cluster-identifier $CLUSTER_ID --skip-final-snapshot
aws rds delete-db-subnet-group --db-subnet-group-name odosan-subnets
aws secretsmanager delete-secret --secret-id $SECRET_NAME --force-delete-without-recovery
aws iam delete-role-policy --role-name OdosanProxyRole --policy-name SecretsRead
aws iam delete-role --role-name OdosanProxyRole
aws ec2 delete-security-group --group-id $SG_ID
```
