# AWS SAA-C03 Study Roadmap

> Built for someone who deployed a full-stack app (Next.js + NestJS + PostgreSQL) on Railway.
> GermanUp is the hands-on lab throughout — you'll re-deploy it on real AWS services week by week.

---

## Resources (get these first)

| Resource | Cost | Purpose |
|---|---|---|
| Stephane Maarek — Ultimate AWS SAA-C03 (Udemy) | ~$15 on sale | Main course |
| Tutorials Dojo practice exams (Jon Bonso) | ~$15 | Best practice tests — buy at Week 6 |
| AWS Free Tier account | Free | All labs |
| AWS Skill Builder | Free | Supplemental labs |
| ExamTopics SAA-C03 | Free | Extra questions |

**Don't buy anything else.** Maarek + Tutorials Dojo is the proven combo.

---

## Mental Model (from your background)

| What you know | AWS equivalent |
|---|---|
| Railway (frontend host) | S3 + CloudFront |
| Railway (backend host) | EC2 / ECS / Elastic Beanstalk |
| PostgreSQL on Railway | RDS |
| `.env` secrets | Secrets Manager / Parameter Store |
| Railway custom domain | Route 53 |
| Railway's load balancer | ALB (Application Load Balancer) |
| GitHub Actions CI/CD | CodePipeline + CodeDeploy |

---

## Week 1 — AWS Foundations + IAM + Networking

**Theory (Maarek):** AWS regions/AZs, IAM (users, roles, policies, MFA), VPC basics (subnets, route tables, IGW, NAT gateway), Security Groups vs NACLs.

**Hands-on:**
1. Create AWS account, enable MFA on root
2. Create an IAM user for yourself — never use root again
3. Create a VPC: 2 public subnets + 2 private subnets across 2 AZs
4. Launch EC2 t2.micro (free tier) in public subnet, SSH in
5. Security Group: allow port 22 from your IP only

**GermanUp connection:** This is the VPC your whole app will live in. Get it right now.

---

## Week 2 — EC2, S3, EBS, RDS

**Theory:** EC2 instance types, AMIs, EBS volumes, S3 (buckets, storage classes, versioning, lifecycle rules), RDS (Multi-AZ, Read Replicas, automated backups).

**Hands-on:**
1. Launch EC2 t3.micro, install Node, clone GermanUp API, run it manually
2. Create RDS PostgreSQL (free tier: db.t3.micro, single-AZ) in private subnet
3. Run Prisma migrations against it from EC2
4. Create S3 bucket — upload static file — access via URL
5. Hit your NestJS API from the browser via EC2 public IP + port 5001

**GermanUp connection:** Railway PostgreSQL → RDS. NestJS running on EC2.

---

## Week 3 — Load Balancing, Auto Scaling, CloudFront

**Theory:** ALB vs NLB, Target Groups, Auto Scaling Groups (launch templates, scaling policies), CloudFront distributions, origins, cache behaviors, edge locations.

**Hands-on:**
1. Create ALB → target group → EC2 on port 5001
2. Create Launch Template from your EC2's AMI
3. Create Auto Scaling Group (min 1, max 2, desired 1) — terminate an instance, watch it self-heal
4. Create CloudFront distribution — origin = S3 bucket
5. `next build && next export`, upload `out/` to S3, serve via CloudFront

**GermanUp connection:** Frontend on S3+CloudFront (global CDN). API behind ALB.

---

## Week 4 — Route 53, HTTPS, Secrets Manager

**Theory:** Route 53 record types (A, CNAME, Alias), routing policies (weighted, latency, failover), ACM (SSL/TLS certs), Secrets Manager vs Parameter Store.

**Hands-on:**
1. Issue free SSL cert via ACM for your domain
2. Add HTTPS listener to ALB, attach ACM cert
3. Create Route 53 A Alias record → ALB
4. Move `DATABASE_URL`, `ANTHROPIC_API_KEY`, `JWT_SECRET` into Secrets Manager
5. Update NestJS to read secrets at startup instead of from `.env`

**GermanUp connection:** `https://api.yourdomain.com` works. No more hardcoded secrets.

---

## Week 5 — Databases Deep Dive + Caching

**Theory:** RDS Multi-AZ vs Read Replicas, Aurora Serverless v2, DynamoDB (partition keys, GSI, on-demand vs provisioned), ElastiCache (Redis vs Memcached).

**Hands-on:**
1. Enable Multi-AZ on RDS — test failover (reboot with failover)
2. Create a Read Replica — point a read-only query to it
3. Set up ElastiCache Redis (t3.micro) — cache `/vocab` endpoint in NestJS (TTL 5 min)
4. Explore DynamoDB — create a table, understand partition keys (exam staple)

**GermanUp connection:** DB is now HA. Vocab lookups are cached. Real production architecture.

---

## Week 6 — Serverless + SQS/SNS + Monitoring

**Theory:** Lambda (triggers, limits, cold starts, layers), API Gateway (REST vs HTTP), SQS (standard vs FIFO, visibility timeout, DLQ), SNS, EventBridge, CloudWatch (metrics, alarms, logs), CloudTrail.

**Hands-on:**
1. Lambda function that sends weekly vocab report via SNS → email
2. CloudWatch alarm on ALB HTTP 5xx errors → SNS → email alert
3. CloudWatch Log Groups for NestJS on EC2 (cloudwatch-agent)
4. SQS queue — think through how to offload Claude AI corrections asynchronously

**GermanUp connection:** Alarms = you know when your API breaks. SQS = async AI correction UX improvement.

### ⚠️ Start practice exams this week
Take your first Tutorials Dojo timed exam (65 questions, 130 min). Aim for 60%+. Review every wrong answer.

---

## Week 7 — Security, IAM Deep Dive, KMS

**Theory:** IAM roles for services (instance profiles), SCPs, KMS (CMKs, envelope encryption), WAF, Shield, Cognito (User Pools vs Identity Pools), S3 bucket policies vs ACLs.

**Hands-on:**
1. Assign IAM role to EC2 (instance profile) — remove any hardcoded AWS credentials
2. Enable KMS encryption on RDS — rotate the key
3. WAF WebACL on ALB — rate limit rule (e.g., 100 req/IP/5min)
4. (Stretch) Cognito User Pool with Google OAuth — compare to your NextAuth setup

**GermanUp connection:** WAF replaces manual rate limiting. Instance profiles > access keys.

---

## Week 8 — High Availability, DR, Cost Optimization

**Theory:** Multi-region architectures, DR strategies (backup/restore → pilot light → warm standby → multi-site), S3 CRR, RTO vs RPO, Cost Explorer, Trusted Advisor, Savings Plans vs Reserved Instances.

**Hands-on:**
1. Enable S3 versioning + CRR to a second region
2. Write a CloudFormation template for your full stack (VPC + EC2 + RDS + ALB)
3. Deploy it, destroy it, redeploy it — this is IaC
4. Cost Explorer — check what your labs cost, set $20/month billing alarm
5. Stop/delete idle resources (especially NAT Gateways and ALBs)

**GermanUp connection:** CloudFormation = one-command staging environment for GermanUp.

---

## Week 9 — Full Review + Practice Exams

- Take 2 full Tutorials Dojo timed exams
- **Target: 72%+** (exam passing score is ~72%)
- For every wrong answer: write down WHY the right answer is right, not just what it is
- Focus areas (60% of exam): VPC, IAM, S3, RDS, EC2 auto scaling, CloudFront
- Re-watch Maarek sections for any topic scoring below 65%

---

## Week 10 — Final Polish + Book the Exam

- Take 1 more full exam — if 75%+, book the exam within the week
- Skim [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html) (5 pillars)
- Download and read the SAA-C03 Exam Guide PDF from AWS (2 pages, lists exact domain weights)
- Sleep. Don't cram the night before.

---

## Exam Tips

**Format:** 65 questions · 130 minutes · ~$150 USD · Pearson VUE (remote or testing center)

**Question pattern:** Every question is a scenario — "a company needs X with Y constraint." Reason from the scenario, never memorize facts.

**Elimination trick:** Most questions have 2 obviously wrong and 2 plausible answers. Eliminate first:
- "Simplest solution" that costs more → usually wrong
- Multi-AZ when the question only needs a Read Replica → wrong
- Serverless options are usually right when cost optimization is the goal

**Top tested services by frequency:**
1. EC2 + Auto Scaling + ALB
2. S3 (storage classes, lifecycle, versioning, encryption)
3. VPC (subnets, NACLs, SGs, VPN, Direct Connect)
4. RDS + Aurora + ElastiCache
5. IAM (roles, policies, SCPs)
6. Lambda + API Gateway + SQS/SNS
7. Route 53 + CloudFront

**Time:** 130 min ÷ 65 questions = 2 min/question. Flag hard ones, move on, come back.

---

## Cost Safety

After each lab session, stop or delete:
- **Stop** EC2 instances (not terminate — you lose the AMI if you terminate)
- **Delete NAT Gateways** when not in use (~$0.045/hr = $32/month if left on)
- **Delete ALBs** when not in use (~$0.008/hr)
- **Stop RDS** manually (Aurora Serverless auto-pauses after 5 min)

**Day 1 task:** Set a CloudWatch billing alarm at $20/month before anything else.

---

## App Rough Edges (GermanUp — finish before AWS)

| # | Issue | What it needs |
|---|---|---|
| 1 | Google OAuth broken | Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL` in Railway env + add prod callback URL in Google Cloud Console |
| 2 | 13 exercise topics not imported | Generate JSON for all topics, import via admin panel |
| 3 | Stripe production testing | Real test card through checkout + verify webhook hits live API |
| 4 | Verb practice E2E | Import verb → practice session → submit → check stats |
| 5 | Flashcard daily limit | Verify 20/day blocks Free users, Pro is unlimited |
| 6 | Mobile | Real device: layout, touch targets, keyboard on inputs |
