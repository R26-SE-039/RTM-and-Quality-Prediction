from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas, services
from app.database import get_db
from app.ml.predict import predict_quality
from app.ml.weights import FEATURE_ORDER, QUALITY_REJECT_THRESHOLD

router = APIRouter(prefix="/api/tests", tags=["tests"])


@router.post("", response_model=schemas.TestCaseOut, status_code=201)
def create_test_case(payload: schemas.TestCaseCreate, db: Session = Depends(get_db)):
    ac = db.query(models.AcceptanceCriteria).get(payload.acceptance_criteria_id)
    if ac is None:
        raise HTTPException(status_code=404, detail="Acceptance criteria not found")

    test = models.TestCase(**payload.model_dump())
    db.add(test)
    db.commit()
    db.refresh(test)

    services.recompute_rtm_for_requirement(db, ac.requirement_id)
    return test


@router.get("", response_model=list[schemas.TestCaseOut])
def list_test_cases(db: Session = Depends(get_db)):
    return db.query(models.TestCase).order_by(models.TestCase.id).all()


@router.get("/{test_id}", response_model=schemas.TestCaseOut)
def get_test_case(test_id: int, db: Session = Depends(get_db)):
    test = db.query(models.TestCase).get(test_id)
    if test is None:
        raise HTTPException(status_code=404, detail="Test case not found")
    return test


@router.post("/{test_id}/coverage", response_model=schemas.CodeCoverageOut, status_code=201)
def add_code_coverage(test_id: int, payload: schemas.CodeCoverageCreate, db: Session = Depends(get_db)):
    test = db.query(models.TestCase).get(test_id)
    if test is None:
        raise HTTPException(status_code=404, detail="Test case not found")

    coverage = models.CodeCoverage(test_case_id=test_id, **payload.model_dump())
    db.add(coverage)
    db.commit()
    db.refresh(coverage)

    services.recompute_rtm_for_requirement(db, test.acceptance_criteria.requirement_id)
    return coverage


@router.post("/{test_id}/predict-quality", response_model=schemas.QualityPredictionOut)
def predict_quality_endpoint(test_id: int, db: Session = Depends(get_db)):
    test = db.query(models.TestCase).get(test_id)
    if test is None:
        raise HTTPException(status_code=404, detail="Test case not found")

    features = {key: getattr(test, key) for key in FEATURE_ORDER}
    score, method = predict_quality(features)

    test.quality_score = score
    test.status = (
        models.TestStatus.REJECTED if score < QUALITY_REJECT_THRESHOLD else models.TestStatus.APPROVED
    )
    db.commit()
    db.refresh(test)

    services.recompute_rtm_for_requirement(db, test.acceptance_criteria.requirement_id)

    return schemas.QualityPredictionOut(
        test_case_id=test.id,
        quality_score=score,
        status=test.status,
        method=method,
    )
