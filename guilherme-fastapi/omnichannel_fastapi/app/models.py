from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, Integer, String, DateTime, JSON, Text, func, Boolean
from .config import settings

Base = declarative_base()

engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

class ChannelConnection(Base):
    __tablename__ = "channel_connections"
    
    id = Column(Integer, primary_key=True, index=True)
    channel = Column(String(50), index=True)
    config = Column(JSON, nullable=False)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class MessageLog(Base):
    __tablename__ = "message_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    channel = Column(String(50))
    external_id = Column(String(255), nullable=True)
    payload = Column(JSON)
    direction = Column(String(10))
    status = Column(String(50))
    error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())