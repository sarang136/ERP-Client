import PropTypes from "prop-types";
import { Badge, Button, Col, Input } from "reactstrap";
import PharmacyStockPicker from "./PharmacyStockPicker";
import AltSourceRow from "./AltSourceRow";

const MedicineApprovalRow = ({
    med,
    centerId,
    canAct,
    readOnly,
    isChecked,
    dispensedCount,
    pickingHere,
    altSourcesForLine,
    altPickerOpen,
    link,
    resolved,
    eligible,
    remainingQty,
    maxQty,
    sessionRemainingQty,
    usedStockRefs,
    altMaxQtyFor,
    onRowToggle,
    onOpenPicker,
    onCancelPicker,
    onStockPicked,
    onClearStockLink,
    onDispensedCountChange,
    onOpenAltPicker,
    onCancelAltPicker,
    onAltStockPicked,
    onRemoveAltSource,
    onAltDispensedCountChange,
}) => {
    const exceedsStock = isChecked && Number(dispensedCount) > Number(link.stock);
    const exceedsPrescribed = isChecked && remainingQty !== undefined && Number(dispensedCount) > remainingQty;
    const rowDisabled = med.alreadyDispensed || (resolved && !eligible);
    const canToggle = canAct && !rowDisabled;

    return (
        <Col xs={12} lg={6} className="mb-3">
            <div
                className="d-flex justify-content-between align-items-start p-2 border rounded h-100"
                style={{ backgroundColor: "#f4f7fb" }}
            >
                <div className="d-flex align-items-start gap-2 w-100">
                    {canAct && (
                        <Input
                            type="checkbox"
                            className="mt-1"
                            style={
                                med.alreadyDispensed || isChecked
                                    ? undefined
                                    : { backgroundColor: "#fff", borderColor: "#6c757d" }
                            }
                            checked={med.alreadyDispensed || isChecked}
                            disabled={rowDisabled}
                            onChange={onRowToggle}
                        />
                    )}
                    <div className="flex-grow-1">
                        <div
                            className="fw-semibold"
                            style={canToggle ? { cursor: "pointer" } : undefined}
                            onClick={onRowToggle}
                        >
                            {med.medicine?.type} {med.medicine?.name} {med.medicine?.strength}
                        </div>
                        <div
                            className="small text-muted"
                            style={canToggle ? { cursor: "pointer" } : undefined}
                            onClick={onRowToggle}
                        >
                            {med.schedules?.length > 1 ? (
                                med.schedules.map((period, pIdx) => (
                                    <div key={pIdx} className="d-flex">
                                        <span style={{ width: "72px", flexShrink: 0, whiteSpace: "nowrap" }}>
                                            {period.dosageAndFrequency?.morning || 0}-
                                            {period.dosageAndFrequency?.evening || 0}-
                                            {period.dosageAndFrequency?.night || 0}
                                        </span>
                                        <span style={{ whiteSpace: "nowrap" }}>· {period.duration} {period.unit}</span>
                                    </div>
                                ))
                            ) : (
                                <>
                                    {med.dosageAndFrequency?.morning || 0}-
                                    {med.dosageAndFrequency?.evening || 0}-
                                    {med.dosageAndFrequency?.night || 0} · {med.duration} {med.unit}
                                </>
                            )}
                            {!readOnly &&
                                ` · Total qty${med.schedules?.length > 1 ? " (all periods)" : " (by duration)"}: ${med.totalQuantity}${
                                    med.partiallyGiven ? ` (Remaining: ${med.remainingQuantity})` : ""
                                }`}
                        </div>
                        {!med.alreadyDispensed && med.partiallyGiven && !med.rejected && (
                            <Badge color="warning" className="text-dark">
                                Partially given — {med.dispensedCount} of {med.totalQuantity} ({med.remainingQuantity} remaining)
                            </Badge>
                        )}
                        {med.alreadyDispensed && (
                            <div className="small">
                                {med.givenEarlier || !readOnly ? (
                                    <Badge color="secondary">
                                        Given earlier — {med.dispensedCount} of {med.totalQuantity}
                                    </Badge>
                                ) : (
                                    <Badge color="success">
                                        Given — {med.dispensedCount} of {med.totalQuantity}
                                    </Badge>
                                )}
                                {readOnly && med.givenByName && (
                                    <span className="text-muted ms-2" style={{ fontSize: "0.75rem" }}>
                                        by {med.givenByName}
                                    </span>
                                )}
                                {med.sources && med.sources.length > 1 ? (
                                    <div className="mt-1">
                                        {med.sources.map((src, i) => (
                                            <div
                                                key={i}
                                                className="d-flex align-items-start gap-2 py-1"
                                                style={i > 0 ? { borderTop: "1px solid #e3e8ee" } : undefined}
                                            >
                                                <div className="d-flex flex-column gap-1 flex-shrink-0" style={{ width: 84 }}>
                                                    <Badge
                                                        color={src.givenEarlier || !readOnly ? "secondary" : "success"}
                                                        style={{ fontSize: "0.65rem" }}
                                                    >
                                                        {src.givenEarlier || !readOnly ? "Earlier" : "Given"}
                                                    </Badge>
                                                    {src.isSubstitute && (
                                                        <Badge color="warning" className="text-dark" style={{ fontSize: "0.65rem" }}>
                                                            Alt
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div className="fw-semibold" style={{ fontSize: "0.8rem" }}>
                                                        {src.dispensedCount} × {src.medicineName || src.batch?.medicineName || "Medicine"}
                                                    </div>
                                                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                                                        {src.batch?.medicineName && <>{src.batch.medicineName} · </>}
                                                        {src.batch?.id && <> {src.batch.id} · </>}
                                                        Batch: {src.batch?.Batch || "-"}
                                                        {src.batch?.company && <> · {src.batch.company}</>}
                                                        {readOnly && src.givenByName && (
                                                            <> · by {src.givenByName}</>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    med.batch && (
                                        <div className="text-muted mt-1">
                                            {med.batch.medicineName && <>{med.batch.medicineName} · </>}
                                            {med.batch.id && <> {med.batch.id} · </>}
                                            Batch: {med.batch.Batch || "-"}
                                            {med.batch.company && <> · {med.batch.company}</>}
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                        {!med.alreadyDispensed && !med.partiallyGiven && med.rejected && (
                            <Badge color="danger">Rejected — not dispensed</Badge>
                        )}
                        {readOnly && !med.alreadyDispensed && !med.partiallyGiven && !med.rejected && (
                            <Badge color="secondary">Not given</Badge>
                        )}
                        {readOnly && !med.alreadyDispensed && (
                            <div className="small text-muted mt-1">
                                Prescribed qty: {med.totalQuantity} · Given: {med.dispensedCount || 0}
                            </div>
                        )}
                        {!readOnly && !med.alreadyDispensed && !med.rejected && resolved && !pickingHere && (
                            <div className="small d-flex align-items-center gap-2 flex-wrap">
                                <span>
                                    {link.medicineName && <>{link.medicineName} · </>}
                                    {link.phrId && <> {link.phrId} · </>}
                                    Batch: {link.batch || "-"}
                                    {link.company && <> · {link.company}</>}
                                    {" · Stock: "}{link.stock}
                                    {link.expired && <span className="text-danger ms-1">EXPIRED</span>}
                                </span>
                                {canAct && (
                                    <>
                                        <Button color="link" size="sm" className="p-0" onClick={onOpenPicker}>
                                            change
                                        </Button>
                                        {link.isLocal && (
                                            <Button
                                                color="link"
                                                size="sm"
                                                className="p-0 text-danger"
                                                onClick={onClearStockLink}
                                            >
                                                unlink
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                        {!med.alreadyDispensed && !med.rejected && !resolved && canAct && !pickingHere && (
                            <span className="small text-muted">Tick to select from inventory</span>
                        )}
                        {canAct && pickingHere && (
                            <div className="mt-2" style={{ width: "100%" }}>
                                <PharmacyStockPicker
                                    centerId={centerId}
                                    medicineId={med.medicine?._id}
                                    selectedPharmacyId={link.pharmacyStockRef}
                                    onSelect={onStockPicked}
                                    onCancel={onCancelPicker}
                                />
                            </div>
                        )}
                        {!med.alreadyDispensed && canAct && isChecked && (
                            <div className="d-flex align-items-center gap-2 mt-1">
                                <label className="small text-muted mb-0">Qty to dispense:</label>
                                <Input
                                    type="number"
                                    bsSize="sm"
                                    min={1}
                                    step={1}
                                    max={Number.isFinite(maxQty) ? maxQty : undefined}
                                    style={{ width: "90px" }}
                                    value={dispensedCount ?? ""}
                                    invalid={exceedsStock || exceedsPrescribed}
                                    onKeyDown={(e) => {
                                        // Whole units only: no decimals, exponents or signs.
                                        if ([".", ",", "e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                                    }}
                                    onChange={(e) => {
                                        const raw = e.target.value;
                                        if (raw === "") {
                                            onDispensedCountChange("");
                                        } else if (Number.isInteger(Number(raw))) {
                                            const val = Number(raw);
                                            // Never let a typed amount exceed what's actually
                                            // deliverable — otherwise an invalid, over-typed
                                            // value would still get counted in totals.
                                            onDispensedCountChange(Number.isFinite(maxQty) ? Math.min(val, maxQty) : val);
                                        }
                                    }}
                                />
                                {exceedsStock && (
                                    <span className="small text-danger">Exceeds available stock ({link.stock})</span>
                                )}
                                {exceedsPrescribed && (
                                    <span className="small text-danger">
                                        Can't exceed remaining prescribed qty ({remainingQty})
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Covering a shortfall with a same-generic-name substitute — available
                            whether or not the medicine's own stock was picked, so it also
                            covers the case where it's out of stock entirely. */}
                        {!med.alreadyDispensed && !med.rejected && canAct && (
                            <div className="mt-2">
                                {altSourcesForLine.map((alt) => (
                                    <AltSourceRow
                                        key={alt.key}
                                        alt={alt}
                                        isSubstitute={
                                            !!alt.medicineId &&
                                            !!med.medicine?._id &&
                                            String(alt.medicineId) !== String(med.medicine._id)
                                        }
                                        maxQty={altMaxQtyFor(alt)}
                                        onChangeQty={(value) => onAltDispensedCountChange(alt.key, value)}
                                        onRemove={() => onRemoveAltSource(alt.key)}
                                    />
                                ))}

                                {altPickerOpen && (
                                    <div className="mb-1">
                                        <PharmacyStockPicker
                                            centerId={centerId}
                                            medicineId={med.medicine?._id}
                                            excludeIds={usedStockRefs}
                                            onSelect={onAltStockPicked}
                                            onCancel={onCancelAltPicker}
                                        />
                                    </div>
                                )}

                                {!altPickerOpen &&
                                    !pickingHere &&
                                    (isChecked || altSourcesForLine.length > 0) &&
                                    sessionRemainingQty > 0 && (
                                        <Button color="link" size="sm" className="p-0" onClick={onOpenAltPicker}>
                                            + Add another source to cover the rest ({sessionRemainingQty} remaining)
                                        </Button>
                                    )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Col>
    );
};

MedicineApprovalRow.propTypes = {
    med: PropTypes.object.isRequired,
    centerId: PropTypes.string,
    canAct: PropTypes.bool,
    readOnly: PropTypes.bool,
    isChecked: PropTypes.bool,
    dispensedCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    pickingHere: PropTypes.bool,
    altSourcesForLine: PropTypes.array,
    altPickerOpen: PropTypes.bool,
    link: PropTypes.object.isRequired,
    resolved: PropTypes.bool,
    eligible: PropTypes.bool,
    remainingQty: PropTypes.number,
    maxQty: PropTypes.number,
    sessionRemainingQty: PropTypes.number,
    usedStockRefs: PropTypes.array,
    altMaxQtyFor: PropTypes.func.isRequired,
    onRowToggle: PropTypes.func.isRequired,
    onOpenPicker: PropTypes.func.isRequired,
    onCancelPicker: PropTypes.func.isRequired,
    onStockPicked: PropTypes.func.isRequired,
    onClearStockLink: PropTypes.func.isRequired,
    onDispensedCountChange: PropTypes.func.isRequired,
    onOpenAltPicker: PropTypes.func.isRequired,
    onCancelAltPicker: PropTypes.func.isRequired,
    onAltStockPicked: PropTypes.func.isRequired,
    onRemoveAltSource: PropTypes.func.isRequired,
    onAltDispensedCountChange: PropTypes.func.isRequired,
};

export default MedicineApprovalRow;
