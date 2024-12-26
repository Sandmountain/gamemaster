"use client";

import { useState } from "react";
import RoomView from "@/app/admin/components/RoomView";
import RoomsList from "@/app/admin/components/RoomsList";

export default function AdminPage() {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
  };

  const handleBackToRooms = () => {
    setSelectedRoomId(null);
  };

  return (
    <div className="min-h-screen p-8">
      {selectedRoomId ? (
        <RoomView roomId={selectedRoomId} onBack={handleBackToRooms} />
      ) : (
        <RoomsList onRoomSelect={handleRoomSelect} />
      )}
    </div>
  );
}
