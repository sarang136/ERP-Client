import { Card, CardBody, Col, Input, Label, Row } from "reactstrap";

const PsychBar = ({ search, setSearch, flag, setFlag, scope, setScope }) => {
  return (
    <Card>
      <CardBody>
        <Row className="gap-2 align-items-end">
          <Col xs={12} md={3} lg={2}>
            <Label>Patients</Label>
            <Input
              className="form-control"
              onChange={(e) => setScope(e.target.value)}
              value={scope}
              bsSize="sm"
              type="select"
            >
              <option value="ALL">All Patients</option>
              <option value="MY">My Patients</option>
            </Input>
          </Col>
          <Col xs={12} md={4} lg={3}>
            <Label>Session status</Label>
            <Input
              className="form-control"
              onChange={(e) => setFlag(e.target.value)}
              value={flag}
              bsSize="sm"
              type="select"
            >
              <option value="">All</option>
              <option value="overdue">Session overdue</option>
              <option value="today">Session due today</option>
              <option value="ok">Up to date</option>
            </Input>
          </Col>
          <Col xs={12} md={4} lg={3}>
            <Label className="d-block invisible">Search</Label>
            <div className="search-box">
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control"
                placeholder="Search Patients (Name, UID)..."
              />
              <i className="ri-search-line search-icon" />
            </div>
          </Col>
        </Row>
      </CardBody>
    </Card>
  );
};

export default PsychBar;
