#!/usr/bin/env python3
import uvicorn
import os
import sys

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(__file__))

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )