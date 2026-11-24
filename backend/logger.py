"""
Centralized logging configuration for TrueSignal backend.

All backend modules should import logger from here instead of using print().
Logs are output to stdout in production (captured by Render) with structured formatting.
"""
import logging
import sys

# Create a configured logger instance
logger = logging.getLogger("truesignal")

# Set log level from environment or default to INFO
log_level = logging.INFO

# Only configure if not already configured (prevents duplicate handlers)
if not logger.handlers:
    logger.setLevel(log_level)

    # Console handler (stdout for Render/Docker)
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(log_level)

    # Format: timestamp [LEVEL] module - message
    formatter = logging.Formatter(
        '%(asctime)s [%(levelname)s] %(name)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)

    logger.addHandler(handler)

# Prevent propagation to root logger
logger.propagate = False
