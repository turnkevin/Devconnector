import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Landing from "./components/layout/Landing";
import Register from "./components/auth/Register";
import Login from "./components/auth/Login";
import Alert from "./components/layout/Alert";

//Redux
import { Provider } from "react-redux";
import store from "./store";
import "./App.css";
const App = () => {
  return (
    <Provider store={store}>
      <Router>
        {/* <nav> tag*/}
        <Navbar />

        <Routes>
          {/* section.landing */}
          <Route path="/" element={<Landing />} />
        </Routes>
        <section className="container">
          <Alert />
          <Routes>
            <Route path="register" element={<Register />} />
            <Route path="login" element={<Login />} />
          </Routes>
        </section>
      </Router>
    </Provider>
  );
};

export default App;
