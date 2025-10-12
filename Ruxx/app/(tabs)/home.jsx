import { useState, useCallback, useEffect } from "react";
import Dashboard from "../dashboard";

export default function HomeTab() {
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState([]);

  const fetchDashboardData = async () => {
    // 🔄 replace with your Appwrite call
    const result = [
      { id: "1", title: "Transaction 1" },
      { id: "2", title: "Transaction 2" },
    ];
    setData(result);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, []);

  return (
    <Dashboard
      data={data}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
}
