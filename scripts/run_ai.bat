@echo off
if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
)
py -3.10 ai\face_service.py %*
