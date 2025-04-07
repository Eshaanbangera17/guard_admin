import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "./app.css";

// Reusable UI Components

const Card = ({ children, className = "" }) => (
  <motion.div
    className={`card ${className}`}
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    {children}
  </motion.div>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`card-content ${className}`}>{children}</div>
);

const Avatar = ({ src, alt, className = "" }) => (
  <motion.img
    src={src}
    alt={alt}
    className={`avatar ${className}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  />
);

const Button = ({ children, onClick, className = "" }) => (
  <motion.button
    onClick={onClick}
    className={`button ${className}`}
    whileHover={{ scale: 1.05 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    {children}
  </motion.button>
);

const ProgressBar = ({ value, max }) => {
  const percentage = (value / max) * 100;
  let bgColor;
  if (percentage < 50) bgColor = "#F44336"; // red
  else if (percentage < 80) bgColor = "#FFA500"; // orange
  else bgColor = "#4CAF50"; // green

  return (
    <div className="progress-container">
      <div
        className="progress-inner"
        style={{ width: `${percentage}%`, backgroundColor: bgColor }}
      ></div>
    </div>
  );
};

export default function GuardPatrollingDashboard() {
  const [guards, setGuards] = useState([]);
  const [selectedGuard, setSelectedGuard] = useState(null);
  const [patrolHistory, setPatrolHistory] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [chartType, setChartType] = useState("weekly");

  // Fetch all guards on component mount
  useEffect(() => {
    fetch("http://localhost:5000/api/guards")
      .then((response) => response.json())
      .then((data) => {
        setGuards(data);
        if (data && data.length > 0) {
          setSelectedGuard(data[0]);
        }
      })
      .catch((error) => console.error("Error fetching guards:", error));
  }, []);

  // Fetch patrol history and performance data when selectedGuard changes
  useEffect(() => {
    if (selectedGuard) {
      fetch(
        `http://localhost:5000/api/guards/${selectedGuard.id}/patrol-history`
      )
        .then((response) => response.json())
        .then((data) => setPatrolHistory(data))
        .catch((error) =>
          console.error("Error fetching patrol history:", error)
        );

      fetch(`http://localhost:5000/api/guards/${selectedGuard.id}/weekly`)
        .then((response) => response.json())
        .then((data) => setWeeklyData(data))
        .catch((error) => console.error("Error fetching weekly data:", error));

      fetch(`http://localhost:5000/api/guards/${selectedGuard.id}/monthly`)
        .then((response) => response.json())
        .then((data) => setMonthlyData(data))
        .catch((error) =>
          console.error("Error fetching monthly data:", error)
        );
    }
  }, [selectedGuard]);

  // Export patrol history as CSV using Blob
  const exportCSV = () => {
    if (!patrolHistory.length) {
      console.error("No patrol history data available to export.");
      return;
    }
    const csvHeader = "Date,Time,Status,Location\n";
    const csvRows = patrolHistory
      .map(
        (log) =>
          `${log.date},${log.time},${log.status},${log.location}`
      )
      .join("\n");
    const csvContent = csvHeader + csvRows;

    // Create a blob with CSV content and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedGuard.id}_patrol_history.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export patrol history as PDF using jsPDF and autoTable
  const exportPDF = () => {
    if (!patrolHistory.length) {
      console.error("No patrol history data available to export.");
      return;
    }
    const doc = new jsPDF();
    doc.text("Patrol Log History", 14, 20);
    const tableColumn = ["Date", "Time Completed", "Status", "Location"];
    const tableRows = patrolHistory.map((log) => [
      log.date,
      log.time,
      log.status,
      log.location,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });

    doc.save(`${selectedGuard.id}_patrol_history.pdf`);
  };

  return (
    <motion.div
      className="dashboard-container"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <header className="dashboard-header">
        <h1>SmartDwell Technology</h1>
        <h2>Guard Patrolling System</h2>
      </header>

      {/* Patrol Log History Table */}
      <Card className="log-card">
        <CardContent>
          <h3 className="section-title">Patrol Log History</h3>
          <table className="log-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time Completed</th>
                <th>Status</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {patrolHistory.length ? (
                patrolHistory.map((log, index) => (
                  <tr key={index}>
                    <td>{log.date}</td>
                    <td>{log.time}</td>
                    <td>{log.status}</td>
                    <td>{log.location}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No log data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Guard Selection Buttons */}
      <div className="guard-button-container">
        {guards.map((guard) => (
          <Button key={guard.id} onClick={() => setSelectedGuard(guard)}>
            {guard.name}
          </Button>
        ))}
      </div>

      {/* Guard Info Card */}
      {selectedGuard && (
        <Card className="guard-card">
          <CardContent className="guard-card-content">
            <Avatar
              className="guard-avatar"
              src={selectedGuard.profilePic || "/images/default_avatar.jpg"}
              alt={selectedGuard.name}
            />
            <div className="guard-info">
              <h2 className="guard-name">{selectedGuard.name}</h2>
              <p className="guard-details">ID: {selectedGuard.id}</p>
              <p className="guard-details">Shift: {selectedGuard.shift}</p>
              <p className="guard-details">
                Location: {selectedGuard.location}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patrolling Progress */}
      {selectedGuard && (
        <Card className="progress-card">
          <CardContent>
            <h3 className="section-title">Patrolling Completion</h3>
            <ProgressBar
              value={selectedGuard.completionRate || 0}
              max={100}
            />
            <p className="progress-text">
              {selectedGuard.completionRate || 0}% Completed
            </p>
            <p className="progress-text">
              Missed Patrols: {selectedGuard.missedPatrols || 0}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Chart Type Toggle */}
      <div className="chart-toggle-container">
        <Button
          onClick={() => setChartType("weekly")}
          className={chartType === "weekly" ? "active" : ""}
        >
          Weekly
        </Button>
        <Button
          onClick={() => setChartType("monthly")}
          className={chartType === "monthly" ? "active" : ""}
        >
          Monthly
        </Button>
      </div>

      {/* Performance Chart */}
      <Card className="chart-card">
        <CardContent>
          <h3 className="section-title">
            {chartType === "weekly"
              ? "Weekly Patrol Performance"
              : "Monthly Patrol Performance"}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            {chartType === "weekly" ? (
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="completed" fill="#4CAF50" name="Completed" />
                <Bar dataKey="missed" fill="#F44336" name="Missed" />
              </BarChart>
            ) : (
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="completed" fill="#4CAF50" name="Completed" />
                <Bar dataKey="missed" fill="#F44336" name="Missed" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Export Buttons */}
      <div className="export-container">
        <Button onClick={exportCSV}>Export CSV</Button>
        <Button onClick={exportPDF}>Export PDF</Button>
      </div>
    </motion.div>
  );
}
