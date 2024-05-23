# the Python Prisma client spawns a new process, which raises
# AttributeError: 'LoggingProxy' object has no attribute 'fileno'
worker_redirect_stdouts = False
broker_connection_retry_on_startup = True
