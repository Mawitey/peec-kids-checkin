import axios from "axios";
import { useState, useEffect } from "react";
import "./App.css";

const API_URL =
  "https://jq7sjvkjsigwfnb5u4pcapjipm0mfntl.lambda-url.us-east-2.on.aws/";

function App({ mode }) {
  const [form, setForm] = useState({
    childName: "",
    parentName: "",
    phone: "",
    classroom: "",
    notes: "",
    pickupCode: "",
  });

  const [message, setMessage] = useState("");
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function generatePickupCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  async function handleAdminLogin(e) {
    e.preventDefault();

    try {
      await signIn({
        username: adminEmail,
        password: adminPassword,
      });

      setIsAdminLoggedIn(true);
      setMessage("");
    } catch (error) {
      console.error(error);
      setMessage("❌ Login failed. Check email and password.");
    }
  }

  async function handleAdminLogout() {
    await signOut();
    setIsAdminLoggedIn(false);
    setAdminEmail("");
    setAdminPassword("");
    setMessage("");
  }

  async function fetchChildren() {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      setChildren(response.data);
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to load children.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (mode === "admin" && isAdminLoggedIn) {
      fetchChildren();
    }
  }, [mode, isAdminLoggedIn]);

  async function handleCheckIn(e) {
    e.preventDefault();

    const code = generatePickupCode();

    const record = {
      childName: form.childName,
      parentName: form.parentName,
      phone: form.phone,
      classroom: form.classroom,
      notes: form.notes,
      pickupCode: code,
    };

    try {
      await axios.post(API_URL, record);
      setMessage(`✅ Checked in successfully. Pickup code: ${code}`);
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to save check-in.");
    }

    setForm({
      childName: "",
      parentName: "",
      phone: "",
      classroom: "",
      notes: "",
      pickupCode: "",
    });
  }

  async function handleCheckOut(e) {
    e.preventDefault();

    const checkoutData = {
      childName: form.childName,
      pickupCode: form.pickupCode,
    };

    try {
      await axios.put(API_URL, checkoutData);
      setMessage(`✅ ${form.childName} checked out successfully.`);

      setForm({
        childName: "",
        parentName: "",
        phone: "",
        classroom: "",
        notes: "",
        pickupCode: "",
      });
    } catch (error) {
      console.error(error);

      if (error.response?.status === 404) {
        setMessage("❌ Child not found or pickup code does not match.");
      } else {
        setMessage("❌ Check-out failed.");
      }
    }
  }

  if (mode === "home") {
    return (
      <div className="page">
        <div className="card">
          <h1>PEEC Kids</h1>
          <p>Choose check-in or check-out.</p>

          <div className="button-group">
            <a href="/check-in" className="btn">Check In</a>
            <a href="/check-out" className="btn secondary">Check Out</a>
            <a href="/admin" className="btn admin">Admin Dashboard</a>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "checkin") {
    return (
      <div className="page">
        <form className="card" onSubmit={handleCheckIn}>
          <h1>Child Check-In</h1>

          <input name="childName" placeholder="Child full name" value={form.childName} onChange={handleChange} required />
          <input name="parentName" placeholder="Parent / guardian name" value={form.parentName} onChange={handleChange} required />
          <input name="phone" placeholder="Phone number" value={form.phone} onChange={handleChange} required />

          <select name="classroom" value={form.classroom} onChange={handleChange} required>
            <option value="">Select classroom</option>
            <option value="Nursery">Nursery</option>
            <option value="Preschool">Preschool</option>
            <option value="Elementary">Elementary</option>
            <option value="Youth">Youth</option>
          </select>

          <textarea name="notes" placeholder="Allergies / emergency notes" value={form.notes} onChange={handleChange} />

          <button type="submit">Check In</button>
          {message && <p className="message">{message}</p>}
          <a href="/" className="back">Back</a>
        </form>
      </div>
    );
  }

  if (mode === "checkout") {
    return (
      <div className="page">
        <form className="card" onSubmit={handleCheckOut}>
          <h1>Child Check-Out</h1>

          <input name="childName" placeholder="Child full name" value={form.childName} onChange={handleChange} required />
          <input name="pickupCode" placeholder="Pickup code" value={form.pickupCode} onChange={handleChange} required />

          <button type="submit">Check Out</button>
          {message && <p className="message">{message}</p>}
          <a href="/" className="back">Back</a>
        </form>
      </div>
    );
  }

  if (mode === "admin") {
    if (!isAdminLoggedIn) {
      return (
        <div className="page">
          <form className="card" onSubmit={handleAdminLogin}>
            <h1>Admin Login</h1>

            <input
              type="email"
              placeholder="Admin email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              required
            />

            <button type="submit">Login</button>
            {message && <p className="message">{message}</p>}
            <a href="/" className="back">Back</a>
          </form>
        </div>
      );
    }

    return (
      <div className="page">
        <div className="card admin-card">
          <h1>Admin Dashboard</h1>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              <p>Total Records: {children.length}</p>

              {children.length === 0 ? (
                <p>No children checked in yet.</p>
              ) : (
                <div className="admin-list">
                  {children.map((child) => (
                    <div className="admin-item" key={child.id}>
                      <strong>{child.childName}</strong>
                      <p>Parent: {child.parentName}</p>
                      <p>Phone: {child.phone}</p>
                      <p>Classroom: {child.classroom}</p>
                      <p>Status: {child.status}</p>
                      <p>Pickup Code: {child.pickupCode}</p>
                      <p>Check-In: {child.checkInTime}</p>
                      {child.checkOutTime && <p>Check-Out: {child.checkOutTime}</p>}
                      {child.notes && <p>Notes: {child.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <button className="btn secondary" onClick={handleAdminLogout}>
            Logout
          </button>

          <a href="/" className="back">Back</a>
        </div>
      </div>
    );
  }

  return null;
}

export default App;