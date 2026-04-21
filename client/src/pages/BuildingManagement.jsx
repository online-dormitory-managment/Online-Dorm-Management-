import { useState, useEffect } from 'react';
import { 
  FaBuilding, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaChevronRight, 
  FaLayerGroup, 
  FaDoorOpen, 
  FaCheck, 
  FaTimes, 
  FaSpinner, 
  FaArrowLeft,
  FaCogs
} from 'react-icons/fa';
import adminDormApi from '../api/adminDormApi';
import toast from 'react-hot-toast';

export default function BuildingManagement() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('buildings'); // buildings, floors, rooms
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('building'); // building, floor, room
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Building
    buildingID: '',
    name: '',
    gender: 'Male',
    location: '',
    campus: 'Main Campus',
    // Floor
    floorNumber: '',
    // Room
    roomNumber: '',
    capacity: 4
  });

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const data = await adminDormApi.getBuildings();
      setBuildings(data || []);
    } catch (error) {
      toast.error('Failed to load buildings');
    } finally {
      setLoading(false);
    }
  };

  const fetchFloors = async (buildingId) => {
    try {
      setLoading(true);
      const data = await adminDormApi.getFloors(buildingId);
      setFloors(data || []);
    } catch (error) {
      toast.error('Failed to load floors');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async (floorId) => {
    try {
      setLoading(true);
      const data = await adminDormApi.getRooms(floorId);
      setRooms(data || []);
    } catch (error) {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBuilding = (building) => {
    setSelectedBuilding(building);
    setView('floors');
    fetchFloors(building._id);
  };

  const handleOpenFloor = (floor) => {
    setSelectedFloor(floor);
    setView('rooms');
    fetchRooms(floor._id);
  };

  const handleBackToBuildings = () => {
    setView('buildings');
    setSelectedBuilding(null);
  };

  const handleBackToFloors = () => {
    setView('floors');
    setSelectedFloor(null);
  };

  // --- CRUD Handlers ---

  const handleAddBuilding = () => {
    setModalType('building');
    setIsEditing(false);
    setFormData({
      buildingID: '',
      name: '',
      gender: 'Male',
      location: '',
      campus: 'Main Campus'
    });
    setIsModalOpen(true);
  };

  const handleEditBuilding = (building) => {
    setModalType('building');
    setIsEditing(true);
    setSelectedItemId(building._id);
    setFormData({
      buildingID: building.buildingID,
      name: building.name,
      gender: building.gender,
      location: building.location,
      campus: building.campus
    });
    setIsModalOpen(true);
  };

  const handleAddFloor = () => {
    setModalType('floor');
    setIsEditing(false);
    setFormData({ floorNumber: '' });
    setIsModalOpen(true);
  };

  const handleAddRoom = () => {
    setModalType('room');
    setIsEditing(false);
    setFormData({ roomNumber: '', capacity: 4 });
    setIsModalOpen(true);
  };

  const handleEditRoom = (room) => {
    setModalType('room');
    setIsEditing(true);
    setSelectedItemId(room._id);
    setFormData({ roomNumber: room.roomNumber, capacity: room.capacity });
    setIsModalOpen(true);
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      if (type === 'building') {
        await adminDormApi.deleteBuilding(id);
        fetchBuildings();
      } else if (type === 'floor') {
        await adminDormApi.deleteFloor(id);
        fetchFloors(selectedBuilding._id);
      } else if (type === 'room') {
        await adminDormApi.deleteRoom(id);
        fetchRooms(selectedFloor._id);
      }
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted`);
    } catch (error) {
      toast.error('Deletion failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modalType === 'building') {
        if (isEditing) {
          await adminDormApi.updateBuilding(selectedItemId, formData);
        } else {
          await adminDormApi.createBuilding(formData);
        }
        fetchBuildings();
      } else if (modalType === 'floor') {
        await adminDormApi.addFloor({ ...formData, buildingId: selectedBuilding._id });
        fetchFloors(selectedBuilding._id);
      } else if (modalType === 'room') {
        if (isEditing) {
          await adminDormApi.updateRoom(selectedItemId, formData);
        } else {
          await adminDormApi.addRoom({ ...formData, floorId: selectedFloor._id });
        }
        fetchRooms(selectedFloor._id);
      }
      setIsModalOpen(false);
      toast.success('Saved successfully');
    } catch (error) {
      console.error('Save error:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto px-6 py-6">
      {/* Breadcrumbs / Back button */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {view !== 'buildings' && (
            <button 
              onClick={view === 'rooms' ? handleBackToFloors : handleBackToBuildings}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            >
              <FaArrowLeft />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {view === 'buildings' && 'Block Management'}
              {view === 'floors' && `Floors — ${selectedBuilding?.name}`}
              {view === 'rooms' && `Rooms — Floor ${selectedFloor?.floorNumber}`}
            </h1>
            <p className="text-sm text-slate-500">
              {view === 'buildings' && 'Manage dormitory buildings (blocks)'}
              {view === 'floors' && `Manage levels of ${selectedBuilding?.buildingID}`}
              {view === 'rooms' && `List of rooms on floor ${selectedFloor?.floorNumber}`}
            </p>
          </div>
        </div>
        
        <button 
          onClick={view === 'buildings' ? handleAddBuilding : view === 'floors' ? handleAddFloor : handleAddRoom}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95"
        >
          <FaPlus />
          {view === 'buildings' && 'New Block'}
          {view === 'floors' && 'Add Floor'}
          {view === 'rooms' && 'Add Room'}
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <FaSpinner className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-slate-500 font-medium tracking-wide">Retrieving data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Buildings View */}
          {view === 'buildings' && buildings.map((b) => (
            <div key={b._id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group border-b-4 border-b-blue-500">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                    b.gender === 'Female' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <FaBuilding />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditBuilding(b)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete('building', b._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{b.name}</h3>
                <p className="text-sm font-medium text-slate-500 mb-4 flex items-center gap-2">
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">ID: {b.buildingID}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    b.gender === 'Female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {b.gender}
                  </span>
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold">
                    {b.campus || 'Main Campus'}
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Floors</p>
                    <p className="text-xl font-bold text-slate-800">{b.totalFloors || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total capacity</p>
                    <p className="text-lg font-bold text-slate-800">{b.totalCapacity || 0} Beds</p>
                  </div>
                  <div className="col-span-2 mt-2 pt-2 border-t border-slate-50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Available Beds</p>
                    <p className={`text-2xl font-black text-center ${ (b.availableBeds > 0) ? 'text-emerald-500' : 'text-rose-500' }`}>
                      {b.availableBeds || 0}
                    </p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleOpenBuilding(b)}
                className="w-full py-4 bg-slate-50 hover:bg-blue-600 hover:text-white transition-all text-sm font-bold flex items-center justify-center gap-2 border-t border-slate-100"
              >
                Manage Floors
                <FaChevronRight className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Floors View */}
          {view === 'floors' && floors.map((f) => (
            <div key={f._id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">
                  <FaLayerGroup />
                </div>
                <button onClick={() => handleDelete('floor', f._id)} className="p-2 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <FaTrash />
                </button>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Floor {f.floorNumber}</h3>
              <div className="flex items-center justify-between text-sm text-slate-600 mb-6 font-medium">
                <span>Total Rooms: {f.totalRooms}</span>
                <span className="text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">Avail Rooms: {f.availableRooms}</span>
              </div>
              <button 
                onClick={() => handleOpenFloor(f)}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md"
              >
                View Rooms
                <FaChevronRight className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Rooms View */}
          {view === 'rooms' && rooms.map((r) => (
            <div key={r._id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                  r.isFull ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <FaDoorOpen />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Room {r.roomNumber}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                      Beds: {r.currentOccupants}/{r.capacity}
                    </p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                      (r.capacity - r.currentOccupants) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {r.capacity - r.currentOccupants} Available
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEditRoom(r)} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg">
                  <FaEdit />
                </button>
                <button onClick={() => handleDelete('room', r._id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg">
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reusable Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">
                {isEditing ? 'Edit' : 'Add'} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-all"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {modalType === 'building' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase">Block ID</label>
                      <input
                        type="text"
                        required
                        value={formData.buildingID}
                        onChange={(e) => setFormData({...formData, buildingID: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase">Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all bg-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase">Campus</label>
                      <input
                        type="text"
                        value={formData.campus}
                        onChange={(e) => setFormData({...formData, campus: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              {modalType === 'floor' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Floor Number</label>
                  <input
                    type="number"
                    required
                    value={formData.floorNumber}
                    onChange={(e) => setFormData({...formData, floorNumber: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                  />
                </div>
              )}

              {modalType === 'room' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase">Room Number</label>
                    <input
                      type="text"
                      required
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase">Capacity</label>
                    <input
                      type="number"
                      required
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3.5 border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-70"
                >
                  {submitting ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
