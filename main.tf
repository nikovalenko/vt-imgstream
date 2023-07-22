# Define AWS provider
provider "aws" {
  access_key = "YOUR_AWS_ACCESS_KEY"
  secret_access_key = "YOUR_AWS_SECRET_ACCESS_KEY"
  region = "us-west-2"  # Replace with your desired AWS region
}

# Define the ECR repository for your Docker image
resource "aws_ecr_repository" "app_repository" {
  name = "vt-imgstream-repo-name"
}

# Define the Task Definition
resource "aws_ecs_task_definition" "app_task_definition" {
  family                   = "vt-imgstream-task-family"
  container_definitions    = jsonencode([
    {
      name  = "vt-imgstream"
      image = "${aws_ecr_repository.app_repository.repository_url}:latest"
      cpu   = 256 # Specify CPU units
      memory = 512 # Specify memory in MiB
      # Add other container definition parameters as needed
    }
  ])

  # Add any required task execution role or task IAM role as needed
}

# Optionally, you can add load balancer configuration for accessing the app
resource "aws_lb" "vt-imgstream-lb" {
  name               = "vt-imgstream-load-balancer"
  internal           = false # Set to true if the load balancer is internal
  security_groups    = ["vt-imgstream-sg-id"] # Replace with the security group IDs for the load balancer
  subnets            = ["vt-imgstream-subnet-id-1", "vt-imgstream-subnet-id-2"] # Replace with the subnet IDs where the load balancer will be deployed
}

# Define a target group for the ECS service
resource "aws_lb_target_group" "app_target_group" {
  name     = "vt-imgstream-target-group"
  port     = 80 # The port on which the app container listens
  protocol = "HTTP"
  vpc_id   = "vt-imgstream-vpc-id" 
}

# Define a listener to forward traffic from the load balancer to the target group
resource "aws_lb_listener" "app_listener" {
  load_balancer_arn = aws_lb.vt-imgstream-lb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_target_group.arn
  }
}

# Define the ECS Cluster
resource "aws_ecs_cluster" "app_cluster" {
  name = "vt-imgstream-cluster"
}

# Define the ECS Service
resource "aws_ecs_service" "app_service" {
  name            = "vt-imgstream-service"
  cluster         = aws_ecs_cluster.app_cluster.id
  task_definition = aws_ecs_task_definition.app_task_definition.arn
  desired_count   = 2 # Specify the number of tasks you want to run

  # Load balancer configuration
  load_balancer {
    target_group_arn = aws_lb_target_group.app_target_group.arn
    container_name   = "vt-imgstream"
    container_port   = 80
  }

  # Health check settings for the service
  health_check_grace_period_seconds = 60
  deployment_maximum_percent        = 200
  deployment_minimum_healthy_percent = 100

  # Auto-scaling configuration (optional)
  # autoscaling {
  #   min_capacity = 2
  #   max_capacity = 10
  # }

  # Placement constraints (optional)
  # placement_constraints {
  #   type       = "memberOf"
  #   expression = "attribute:ecs.availability-zone in ['us-east-1a', 'us-east-1b']"
  # }

  # Other optional configuration settings for the service
  # ...

  # IAM role for the ECS service to access other AWS services (optional)
  # role_arn = "vt-imgstream-service-iam-role-arn"
}

# Output the URL of the load balancer or ECS service endpoint for accessing the app
output "app_endpoint" {
  value = aws_lb.vt-imgstream-lb.dns_name
}