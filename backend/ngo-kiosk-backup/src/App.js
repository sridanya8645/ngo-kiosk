import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import AdminPage from "./AdminPage";
import RegisterPage from "./RegisterPage";
import CheckinPage from "./CheckinPage";
import EventDetailsPage from "./EventDetailsPage";
import AdminRegistrationsPage from './AdminRegistrationsPage';
import RaffleSpinPage from "./RaffleSpinPage";
import RaffleWinnersPage from "./RaffleWinnersPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/checkin" element={<CheckinPage />} />
        <Route path="/event-details" element={<EventDetailsPage />} />
        <Route path="/admin/registrations" element={<AdminRegistrationsPage />} />
        <Route path="/admin/raffle-spin" element={<RaffleSpinPage />} />
        <Route path="/admin/raffle-winners" element={<RaffleWinnersPage />} />
        <Route path="/raffle-winners" element={<RaffleWinnersPage />} />
        <Route path="/raffle-spin" element={<RaffleSpinPage />} />
        <Route path="/registration-details" element={<AdminRegistrationsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
