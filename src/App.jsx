import axios from "axios";
import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Html5QrcodeScanner } from "html5-qrcode";
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
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [qrData, setQrData] = useState("");
  const [lastPickupCode, setLastPickupCode] = useState("");
  const [lastChildName, setLastChildName] = useState("");
  const [scannerStarted, setScannerStarted] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function generatePickupCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  function handleAdminLogin(e) {
    e.preventDefault();
    if (adminPassword === "peec123") {
      setIsAdminLoggedIn(true);
      setMessage("");
    } else {
      setMessage("❌ Incorrect password.");
    }
  }

  function handleAdminLogout() {
    setIsAdminLoggedIn(false);
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

      setMessage(`✅ ብዓወት ተመዝጊቡ። መውሰዲ ኮድ: ${code}`);
      setLastPickupCode(code);
      setLastChildName(form.childName);

      setQrData(
        JSON.stringify({
          childName: form.childName,
          pickupCode: code,
        })
      );
    } catch (error) {
      console.error(error);
      setMessage("❌ ምምዝጋብ ኣይተዓወተን።");
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
      setMessage(`✅ ${form.childName} ብዓወት ተወጺኡ።`);

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
        setMessage("❌ ህጻን ኣይተረኽበን ወይ ኮድ ጌጋ እዩ።");
      } else {
        setMessage("❌ መውጽኢ ኣይተዓወተን።");
      }
    }
  }

  function startQrScanner() {
    if (scannerStarted) return;

    setScannerStarted(true);
    setMessage("");

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: 250,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        try {
          const data = JSON.parse(decodedText);

          setForm((prev) => ({
            ...prev,
            childName: data.childName || "",
            pickupCode: data.pickupCode || "",
          }));

          setMessage("✅ QR code scanned successfully.");

          scanner.clear();
          setScannerStarted(false);
        } catch (error) {
          setMessage("❌ Invalid QR code.");
        }
      },
      () => {}
    );
  }

  async function sharePickupCode() {
    const text = `PEEC Kids Pickup Code\nChild: ${lastChildName}\nPickup Code: ${lastPickupCode}`;

    if (navigator.share) {
      await navigator.share({
        title: "PEEC Kids Pickup Code",
        text,
      });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Pickup code copied. You can paste it in a text message.");
    }
  }

  function downloadQRCode() {
    const canvas = document.getElementById("pickup-qr-code");
    const pngUrl = canvas.toDataURL("image/png");

    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${lastChildName || "peec"}-pickup-qr.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  const checkedInCount = children.filter(
    (child) => child.status === "Checked In"
  ).length;

  const checkedOutCount = children.filter(
    (child) => child.status === "Checked Out"
  ).length;

  const filteredChildren = children.filter((child) => {
    const matchesStatus =
      statusFilter === "All" || child.status === statusFilter;

    const search = searchTerm.toLowerCase();

    const matchesSearch =
      child.childName?.toLowerCase().includes(search) ||
      child.parentName?.toLowerCase().includes(search) ||
      child.phone?.includes(search) ||
      child.classroom?.toLowerCase().includes(search);

    return matchesStatus && matchesSearch;
  });

  if (mode === "home") {
    return (
      <div className="page">
        <div className="card">
          <h1>PEEC ህጻናት</h1>
          <p>መእተዊ ወይ መውጽኢ ምረጹ።</p>

          <div className="button-group">
            <a href="/check-in" className="btn">
              መእተዊ
            </a>
            <a href="/check-out" className="btn secondary">
              መውጽኢ
            </a>
            <a href="/admin" className="btn admin">
              Admin Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "checkin") {
    return (
      <div className="page">
        <form className="card" onSubmit={handleCheckIn}>
          <h1>መእተዊ ህጻን</h1>

          <input name="childName" placeholder="ሙሉእ ስም ህጻን" value={form.childName} onChange={handleChange} required />
          <input name="parentName" placeholder="ስም ወላዲ / ሓላፊ" value={form.parentName} onChange={handleChange} required />
          <input name="phone" placeholder="ቁጽሪ ስልኪ" value={form.phone} onChange={handleChange} required />

          <select name="classroom" value={form.classroom} onChange={handleChange} required>
            <option value="">ክፍሊ ምረጹ</option>
            <option value="Toddlers age 1-3">ታድለርስ ዕድመ 1–3</option>
            <option value="Beginner Class ages 4-6">ጀማሪ ክፍሊ ዕድመ 4–6</option>
            <option value="Primary Class Grades 2-3">ፕራይመሪ ክፍሊ 2–3</option>
            <option value="Junior Class Grades 4-6">ጁኒየር ክፍሊ 4–6</option>
            <option value="Senior Class Grades 7-12">ሲኒየር ክፍሊ 7–12</option>
          </select>

          <textarea name="notes" placeholder="ኣለርጂ / ሓደጋ ሓበሬታ" value={form.notes} onChange={handleChange} />

          <button type="submit">መእተዊ</button>

          {message && <p className="message">{message}</p>}

          {qrData && (
            <div className="qr-box">
              <h3>መውሰዲ QR Code</h3>
              <QRCodeCanvas id="pickup-qr-code" value={qrData} size={180} />
              <p>ወላዲ ኣብ ግዜ መውሰዲ ነዚ የርኢ</p>
              <p><strong>Pickup Code:</strong> {lastPickupCode}</p>

              <button type="button" className="btn" onClick={sharePickupCode}>
                Send / Share to Parent
              </button>

              <button type="button" className="btn secondary" onClick={downloadQRCode}>
                Download QR Code
              </button>
            </div>
          )}

          <a href="/" className="back">ተመለስ</a>
        </form>
      </div>
    );
  }

  if (mode === "checkout") {
    return (
      <div className="page">
        <form className="card" onSubmit={handleCheckOut}>
          <h1>መውጽኢ ህጻን</h1>

          <button type="button" className="btn" onClick={startQrScanner}>
            Scan QR Code
          </button>

          <div id="qr-reader" className="qr-reader"></div>

          <input name="childName" placeholder="ሙሉእ ስም ህጻን" value={form.childName} onChange={handleChange} required />
          <input name="pickupCode" placeholder="መውሰዲ ኮድ" value={form.pickupCode} onChange={handleChange} required />

          <button type="submit">መውጽኢ</button>

          {message && <p className="message">{message}</p>}

          <a href="/" className="back">ተመለስ</a>
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

            <input type="password" placeholder="Enter admin password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required />

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
              <div className="report-box">
                <p>Total Records: {children.length}</p>
                <p>Currently Checked In: {checkedInCount}</p>
                <p>Checked Out: {checkedOutCount}</p>
              </div>

              <input type="text" placeholder="Search by child, parent, phone, or classroom" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

              <div className="filter-buttons">
                <button type="button" className={statusFilter === "All" ? "btn active-filter" : "btn"} onClick={() => setStatusFilter("All")}>All</button>
                <button type="button" className={statusFilter === "Checked In" ? "btn active-filter" : "btn"} onClick={() => setStatusFilter("Checked In")}>Checked In</button>
                <button type="button" className={statusFilter === "Checked Out" ? "btn active-filter" : "btn"} onClick={() => setStatusFilter("Checked Out")}>Checked Out</button>
              </div>

              {filteredChildren.length === 0 ? (
                <p>No records found.</p>
              ) : (
                <div className="admin-list">
                  {filteredChildren.map((child) => (
                    <div className={child.status === "Checked In" ? "admin-item checked-in" : "admin-item checked-out"} key={child.id}>
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