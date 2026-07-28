import enum
from datetime import datetime

from sqlalchemy import (
    JSON,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class CoverageStatus(str, enum.Enum):
    FULLY_COVERED = "FULLY COVERED"
    PARTIAL = "PARTIAL"
    NOT_COVERED = "NOT COVERED"


class RiskLevel(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ActionType(str, enum.Enum):
    REDUNDANT = "redundant"
    CRITICAL = "critical"
    WEAK = "weak"


class Requirement(Base):
    __tablename__ = "requirements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    source: Mapped[str] = mapped_column(String(255), default="")
    req_type: Mapped[str] = mapped_column(String(100), default="")
    wbs_deliverables: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    acceptance_criteria: Mapped[list["AcceptanceCriteria"]] = relationship(
        back_populates="requirement", cascade="all, delete-orphan"
    )
    rtm_entries: Mapped[list["RTMEntry"]] = relationship(
        back_populates="requirement", cascade="all, delete-orphan"
    )
    coverage_gaps: Mapped[list["CoverageGap"]] = relationship(
        back_populates="requirement", cascade="all, delete-orphan"
    )


class AcceptanceCriteria(Base):
    __tablename__ = "acceptance_criteria"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    requirement_id: Mapped[int] = mapped_column(ForeignKey("requirements.id", ondelete="CASCADE"))
    description: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    requirement: Mapped["Requirement"] = relationship(back_populates="acceptance_criteria")
    test_cases: Mapped[list["TestCase"]] = relationship(
        back_populates="acceptance_criteria", cascade="all, delete-orphan"
    )


class TestCase(Base):
    __tablename__ = "test_cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    steps: Mapped[str] = mapped_column(Text, default="")
    acceptance_criteria_id: Mapped[int] = mapped_column(
        ForeignKey("acceptance_criteria.id", ondelete="CASCADE")
    )

    # ML feature inputs (0-100 scale)
    assertion_strength: Mapped[float] = mapped_column(Float, default=0.0)
    coverage_percent: Mapped[float] = mapped_column(Float, default=0.0)
    boundary_coverage: Mapped[float] = mapped_column(Float, default=0.0)
    error_handling: Mapped[float] = mapped_column(Float, default=0.0)
    mutation_resistance: Mapped[float] = mapped_column(Float, default=0.0)

    quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[TestStatus] = mapped_column(
        Enum(TestStatus, name="test_status"), default=TestStatus.PENDING
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    acceptance_criteria: Mapped["AcceptanceCriteria"] = relationship(back_populates="test_cases")
    code_coverage: Mapped[list["CodeCoverage"]] = relationship(
        back_populates="test_case", cascade="all, delete-orphan"
    )
    portfolio_actions: Mapped[list["PortfolioAction"]] = relationship(
        back_populates="test_case", cascade="all, delete-orphan"
    )


class CodeCoverage(Base):
    __tablename__ = "code_coverage"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    test_case_id: Mapped[int] = mapped_column(ForeignKey("test_cases.id", ondelete="CASCADE"))
    module_name: Mapped[str] = mapped_column(String(255), nullable=False)
    coverage_percent: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    test_case: Mapped["TestCase"] = relationship(back_populates="code_coverage")


class RTMEntry(Base):
    """A materialized row of the Requirements Traceability Matrix.

    One row per requirement -> acceptance criterion -> test case chain
    (or per requirement/AC if no test is linked yet). Rows are deleted
    and regenerated whenever the requirement's underlying data changes.
    """

    __tablename__ = "rtm_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    requirement_id: Mapped[int] = mapped_column(ForeignKey("requirements.id", ondelete="CASCADE"))
    acceptance_criteria_id: Mapped[int | None] = mapped_column(
        ForeignKey("acceptance_criteria.id", ondelete="CASCADE"), nullable=True
    )
    test_case_id: Mapped[int | None] = mapped_column(
        ForeignKey("test_cases.id", ondelete="CASCADE"), nullable=True
    )
    coverage_percent: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[CoverageStatus] = mapped_column(Enum(CoverageStatus, name="coverage_status"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    requirement: Mapped["Requirement"] = relationship(back_populates="rtm_entries")
    acceptance_criteria: Mapped["AcceptanceCriteria | None"] = relationship()
    test_case: Mapped["TestCase | None"] = relationship()


class CoverageGap(Base):
    __tablename__ = "coverage_gaps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    requirement_id: Mapped[int] = mapped_column(ForeignKey("requirements.id", ondelete="CASCADE"))
    risk_level: Mapped[RiskLevel] = mapped_column(Enum(RiskLevel, name="risk_level"))
    recommendation: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    requirement: Mapped["Requirement"] = relationship(back_populates="coverage_gaps")


class PortfolioAction(Base):
    __tablename__ = "portfolio_actions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    test_case_id: Mapped[int] = mapped_column(ForeignKey("test_cases.id", ondelete="CASCADE"))
    action_type: Mapped[ActionType] = mapped_column(Enum(ActionType, name="action_type"))
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    test_case: Mapped["TestCase"] = relationship(back_populates="portfolio_actions")


class ProjectSettings(Base):
    """Singleton row holding project metadata shown on the RTM Matrix page."""

    __tablename__ = "project_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_name: Mapped[str] = mapped_column(String(255), default="")
    project_manager: Mapped[str] = mapped_column(String(255), default="")
    project_description: Mapped[str] = mapped_column(Text, default="")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CoverageJobStatus(str, enum.Enum):
    IDLE = "IDLE"
    RUNNING = "RUNNING"
    DONE = "DONE"
    ERROR = "ERROR"


class CoverageReport(Base):
    """Singleton row holding the last GitHub code-coverage analysis run."""

    __tablename__ = "coverage_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    repo_url: Mapped[str] = mapped_column(String(500), default="")
    status: Mapped[CoverageJobStatus] = mapped_column(
        Enum(CoverageJobStatus, name="coverage_job_status"), default=CoverageJobStatus.IDLE
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    statement_coverage: Mapped[float] = mapped_column(Float, default=0.0)
    branch_coverage: Mapped[float] = mapped_column(Float, default=0.0)
    overall_coverage: Mapped[float] = mapped_column(Float, default=0.0)
    files: Mapped[list] = mapped_column(JSON, default=list)
    logs: Mapped[list] = mapped_column(JSON, default=list)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
