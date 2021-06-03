import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import HereMaps from "routes/HereMaps";
import Home from "routes/Home";

function App() {
  return (
    <>
      <Router>
        <Switch>
          <Route exact path="/" render={() => <Home />} />
          <Route exact path="/map" render={() => <HereMaps />} />
          <Route path="*" render={() => <Redirect to="/" />} />
        </Switch>
      </Router>
    </>
  );
}

export default App;
