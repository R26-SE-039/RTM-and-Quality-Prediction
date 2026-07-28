from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models import ActionType, CoverageJobStatus, CoverageStatus, RiskLevel, TestStatus


# ---------- Requirements ----------


class RequirementCreate(BaseModel):
    title: str
    description: str = ""
    source: str = ""
    req_type: str = ""
    wbs_deliverables: str = ""


class RequirementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    source: str
    req_type: str
    wbs_deliverables: str
    created_at: datetime


# ---------- Acceptance Criteria ----------


class AcceptanceCriteriaCreate(BaseModel):
    description: str


class AcceptanceCriteriaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    requirement_id: int
    description: str
    created_at: datetime


# ---------- Test Cases ----------


class TestCaseCreate(BaseModel):
    title: str
    steps: str = ""
    acceptance_criteria_id: int
    assertion_strength: float = 0.0
    coverage_percent: float = 0.0
    boundary_coverage: float = 0.0
    error_handling: float = 0.0
    mutation_resistance: float = 0.0


class TestCaseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    steps: str
    acceptance_criteria_id: int
    assertion_strength: float
    coverage_percent: float
    boundary_coverage: float
    error_handling: float
    mutation_resistance: float
    quality_score: float | None
    status: TestStatus
    created_at: datetime


class QualityPredictionOut(BaseModel):
    test_case_id: int
    quality_score: float
    status: TestStatus
    method: str


# ---------- Code Coverage ----------


class CodeCoverageCreate(BaseModel):
    module_name: str
    coverage_percent: float


class CodeCoverageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    test_case_id: int
    module_name: str
    coverage_percent: float
    created_at: datetime


# ---------- RTM ----------


class RTMTestEntry(BaseModel):
    test_case_id: int
    title: str
    status: TestStatus
    quality_score: float | None
    coverage_percent: float


class RTMAcceptanceCriteriaEntry(BaseModel):
    acceptance_criteria_id: int
    description: str
    tests: list[RTMTestEntry]
    covered: bool


class RTMRequirementEntry(BaseModel):
    requirement_id: int
    title: str
    description: str
    source: str
    req_type: str
    wbs_deliverables: str
    acceptance_criteria: list[RTMAcceptanceCriteriaEntry]
    total_acceptance_criteria: int
    covered_acceptance_criteria: int
    total_tests: int
    avg_coverage_percent: float
    status: CoverageStatus


# ---------- Coverage Gaps ----------


class CoverageGapOut(BaseModel):
    requirement_id: int
    requirement_title: str
    status: CoverageStatus
    risk_level: RiskLevel
    recommendation: str


# ---------- Portfolio ----------


class PortfolioActionOut(BaseModel):
    test_case_id: int
    test_title: str
    action_type: ActionType
    reason: str


class PortfolioAnalysisOut(BaseModel):
    redundant: list[PortfolioActionOut]
    critical: list[PortfolioActionOut]
    weak: list[PortfolioActionOut]


# ---------- Project Settings ----------


class ProjectSettingsIn(BaseModel):
    project_name: str = ""
    project_manager: str = ""
    project_description: str = ""


class ProjectSettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_name: str
    project_manager: str
    project_description: str


# ---------- Dashboard ----------


class TrendPoint(BaseModel):
    date: str
    avg_quality: float
    avg_coverage: float


class DashboardSummaryOut(BaseModel):
    tests_analyzed: int
    avg_quality_score: float
    coverage_rate: float
    success_rate: float
    quality_trend_pct: float
    trend: list[TrendPoint]
    requirements_covered: int
    requirements_total: int


# ---------- GitHub Code & Branch Coverage ----------


class CoverageAnalyzeRequest(BaseModel):
    repo_url: str


class CoverageFileEntry(BaseModel):
    file_name: str
    statements: int
    statement_coverage: float
    branches: int
    branch_coverage: float
    overall_coverage: float


class CoverageLogEntry(BaseModel):
    timestamp: str
    level: str
    message: str


class CoverageStatusOut(BaseModel):
    status: CoverageJobStatus
    repo_url: str
    error_message: str | None
    github_connected: bool
    logs: list[CoverageLogEntry] = []


class CoverageReportOut(BaseModel):
    status: CoverageJobStatus
    repo_url: str
    error_message: str | None
    statement_coverage: float
    branch_coverage: float
    overall_coverage: float
    files: list[CoverageFileEntry]
    logs: list[CoverageLogEntry] = []
    updated_at: datetime | None


class GithubConnectionStatusOut(BaseModel):
    connected: bool
    reason: str | None
    username: str | None
