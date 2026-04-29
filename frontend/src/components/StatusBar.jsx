import { useEffect, useState } from "react";
import API from "../api";

function StatusBar({ currentUser, onOpen }) {
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    const fetchStatuses = async () => {
      const { data } = await API.get("/status");
      setStatuses(data);
    };
    fetchStatuses();
  }, []);

  // group by user
  const grouped = {};
  statuses.forEach((s) => {
    if (!grouped[s.user._id]) grouped[s.user._id] = [];
    grouped[s.user._id].push(s);
  });

  return (
    <div className="status-bar">
      {/* My status */}
      <div className="status-item" onClick={() => onOpen(grouped[currentUser._id] || [], true)}>
        <img src={currentUser.profilePic} />
        <span>My Status</span>
      </div>

      {Object.values(grouped).map((list) => {
        const u = list[0].user;
        if (u._id === currentUser._id) return null;

        return (
          <div key={u._id} className="status-item" onClick={() => onOpen(list, false)}>
            <img src={u.profilePic} />
            <span>{u.name}</span>
          </div>
        );
      })}
    </div>
  );
}

export default StatusBar;