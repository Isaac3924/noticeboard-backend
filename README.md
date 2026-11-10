# Secure Team Noticeboard - Backend Architecture

A secure, enterprise-ready REST API built to demonstrate modern cloud infrastructure deployment, database integration, and stateless authentication. This project was developed as a proof-of-concept for CoBank's full-stack and cloud engineering workflows.

## Infrastructure & Tech Stack
* **Runtime:** Node.js with TypeScript & Express
* **Database:** AWS RDS (PostgreSQL)
* **Deployment:** AWS Elastic Beanstalk
* **Monitoring:** AWS CloudWatch (active log streaming)
* **Authentication:** bcrypt hashing & JSON Web Tokens (JWT) via `HttpOnly` cookies

## Security Features
* Environment variables strictly managed outside of source control.
* Parameterized SQL queries to prevent injection attacks.
* Dynamic CORS policy configuration securely handling cross-origin requests from the React client.
* **VPC Security Group Referencing:** RDS ingress restricted dynamically to the Elastic Beanstalk security group, ensuring internal traffic routing without hardcoded IP whitelisting.