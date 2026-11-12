import { Card, CardBody, Col, Input, Label, Row, Spinner } from "reactstrap";
import { connect } from "react-redux";
import Select from "react-select";
import RenderWhen from "../../../../Components/Common/RenderWhen";
// import RefreshButton from "../../../../Components/Common/RefreshButton";
import { PATIENT_TYPE_OPTIONS } from "../../../../Components/constants/patient";

const SCOPE_OPTIONS = [
  { value: "ALL", label: "All Patients" },
  { value: "MY", label: "My Patients" },
];

const STATUS_OPTIONS = [{ value: "", label: "All Patients" }, ...PATIENT_TYPE_OPTIONS];

const PsychBar = ({ search, setSearch, flag, setFlag, scope, setScope, onRefresh, loading }) => {
  return (
    <Card>
      <CardBody>
        <Row className="gap-2 align-items-end">
          <Col xs={12} md={3} lg={2}>
            <Label>Patients</Label>
            <Select
              options={SCOPE_OPTIONS}
              value={SCOPE_OPTIONS.find((o) => o.value === scope)}
              onChange={(option) => setScope(option.value)}
              isSearchable={false}
            />
          </Col>
          <Col xs={12} md={4} lg={3}>
            <Label>Filter by Status</Label>
            <Select
              options={STATUS_OPTIONS}
              value={STATUS_OPTIONS.find((o) => o.value === flag)}
              onChange={(option) => setFlag(option.value)}
              isSearchable={false}
            />
          </Col>
          <Col xs={10} md={4} lg={3}>
            <Label className="d-block invisible">Search</Label>
            <div className="search-box position-relative">
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control"
                placeholder="Search Patients (Name, UID)..."
              />
              <i className="ri-search-line search-icon" />
              <RenderWhen isTrue={loading}>
                <Spinner
                  className="position-absolute end-0 top-50 translate-middle-y me-2"
                  color="success"
                  size="sm"
                />
              </RenderWhen>
            </div>
          </Col>
          {/* <Col xs={2} md="auto" className="d-flex ms-md-auto">
            <Label className="d-none d-md-block invisible">Refresh</Label>
            <RefreshButton loading={loading} onRefresh={onRefresh} />
          </Col> */}
        </Row>
      </CardBody>
    </Card>
  );
};

const mapStateToProps = (state) => ({
  loading: state.Psychologist.loading,
});

export default connect(mapStateToProps)(PsychBar);
