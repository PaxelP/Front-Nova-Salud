import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Package, Plus, AlertTriangle, Search, LogOut, Pill, Clock, Trash2, Minus } from 'lucide-react';

const Dashboard = ({ user, onLogout }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carrito, setCarrito] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [ventas, setVentas] = useState([]);
  
  // Estados para Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null); // Para ver detalles de una venta
  const [newProduct, setNewProduct] = useState({
    nombre: '', precio: '', stock_actual: '', stock_minimo: '', codigo_barras: ''
  });

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      const res = await api.get('/productos');
      setProductos(res.data);
    } catch (err) {
      console.error('Error cargando productos');
    } finally {
      setLoading(false);
    }
  };

  const fetchVentas = async () => {
    try {
      const res = await api.get('/ventas');
      setVentas(res.data);
      setShowHistoryModal(true);
    } catch (err) {
      alert('Error al obtener el historial');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post('/productos', newProduct);
      alert('✅ Producto añadido al inventario');
      setShowAddModal(false);
      setNewProduct({ nombre: '', precio: '', stock_actual: '', stock_minimo: '', codigo_barras: '' });
      fetchProductos();
    } catch (err) {
      alert('❌ Error al añadir producto');
    }
  };

  const addToCart = (producto) => {
    const existe = carrito.find(item => item.id === producto.id);
    if (existe) {
      if (existe.cantidad >= producto.stock_actual) {
        alert('No hay más stock disponible');
        return;
      }
      setCarrito(carrito.map(item => 
        item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  const updateCartQuantity = (id, delta) => {
    setCarrito(carrito.map(item => {
      if (item.id === id) {
        const nuevaCantidad = item.cantidad + delta;
        if (nuevaCantidad > item.stock_actual) {
          alert('Stock máximo alcanzado');
          return item;
        }
        if (nuevaCantidad < 1) return item;
        return { ...item, cantidad: nuevaCantidad };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const finalizeSale = async () => {
    if (carrito.length === 0) return;
    try {
      const total = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
      await api.post('/ventas', {
        usuario_id: user.id,
        total,
        productos: carrito.map(item => ({
          id: item.id,
          cantidad: item.cantidad,
          precio: item.precio
        }))
      });
      alert('✅ Venta realizada con éxito');
      setCarrito([]);
      fetchProductos();
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.msg || 'No se pudo completar la venta'));
    }
  };

  const lowStockCount = productos.filter(p => p.stock_actual <= p.stock_minimo).length;
  const filteredProducts = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.codigo_barras?.includes(searchTerm)
  );

  return (
    <div className="dashboard">
      <nav className="navbar glass-card">
        <div className="nav-brand">
          <Pill size={24} color="var(--primary)" />
          <span>Nova Salud <span style={{color: 'var(--accent)', fontSize: '0.8rem'}}>Sync</span></span>
        </div>
        <div className="user-info">
          <button className="history-icon-btn" onClick={fetchVentas} title="Ver Historial de Ventas">
            <Clock size={20} />
          </button>
          <div className="alerts-badge">
            <AlertTriangle size={20} color={lowStockCount > 0 ? '#ef4444' : '#94a3b8'} />
            {lowStockCount > 0 && <span className="badge-count">{lowStockCount}</span>}
          </div>
          <span><strong>{user?.nombre}</strong></span>
          <button onClick={onLogout} className="logout-btn"><LogOut size={18} /></button>
        </div>
      </nav>

      <div className="main-layout">
        <main className="content">
          <header className="content-header">
            <div className="title-area">
              <h2>Panel de Control</h2>
              {lowStockCount > 0 && (
                <span className="stock-alert-text">⚠️ {lowStockCount} productos requieren reposición inmediata</span>
              )}
            </div>
            <div className="actions">
              <div className="search-bar">
                <Search size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar por nombre o barras..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="add-btn" onClick={() => setShowAddModal(true)}>
                <Plus size={18} /> Nuevo Producto
              </button>
            </div>
          </header>

          <div className="product-grid">
            {loading ? (
              <p>Cargando inventario...</p>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map(p => (
                <div key={p.id} className={`glass-card product-card ${p.stock_actual <= p.stock_minimo ? 'critical' : ''}`}>
                  <div className="card-header">
                    <span className="sku">{p.codigo_barras || 'SIN SKU'}</span>
                    {p.stock_actual <= p.stock_minimo && <span className="alert-tag">REPOSICIÓN</span>}
                  </div>
                  <h3>{p.nombre}</h3>
                  <p className="price">S/ {p.precio}</p>
                  <div className="stock-info">
                    <div className="stock-bar-bg">
                      <div 
                        className="stock-bar-fill" 
                        style={{ 
                          width: `${Math.min((p.stock_actual/50)*100, 100)}%`,
                          backgroundColor: p.stock_actual <= p.stock_minimo ? '#ef4444' : '#22c55e'
                        }}
                      ></div>
                    </div>
                    <span>Stock: <strong>{p.stock_actual}</strong></span>
                  </div>
                  <button 
                    className="add-to-cart-btn" 
                    onClick={() => addToCart(p)}
                    disabled={p.stock_actual === 0}
                  >
                    {p.stock_actual === 0 ? 'AGOTADO' : 'VENDER'}
                  </button>
                </div>
              ))
            ) : (
              <p className="no-results">No se encontraron productos.</p>
            )}
          </div>
        </main>

        <aside className="sidebar-cart glass-card">
          <h3>Carrito de Venta</h3>
          <div className="cart-items">
            {carrito.length === 0 ? (
              <div className="empty-cart-state">
                <Package size={40} color="#334155" />
                <p>Carrito vacío</p>
              </div>
            ) : (
              carrito.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-info">
                    <span className="item-name">{item.nombre}</span>
                    <div className="item-controls">
                       <button onClick={() => updateCartQuantity(item.id, -1)}><Minus size={14}/></button>
                       <span className="item-qty">{item.cantidad}</span>
                       <button onClick={() => updateCartQuantity(item.id, 1)}><Plus size={14}/></button>
                    </div>
                  </div>
                  <div className="item-price-remove">
                    <span className="item-subtotal">S/ {(item.precio * item.cantidad).toFixed(2)}</span>
                    <button className="remove-item-btn" onClick={() => removeFromCart(item.id)}><Trash2 size={16}/></button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="cart-footer">
            <div className="total">
              <span>Total a pagar:</span>
              <span>S/ {carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0).toFixed(2)}</span>
            </div>
            <button 
              className="checkout-btn" 
              onClick={finalizeSale}
              disabled={carrito.length === 0}
            >
              Completar Venta (F10)
            </button>
          </div>
        </aside>
      </div>

      {/* Modal para Agregar Producto */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content">
            <h3>Registrar Nuevo Medicamento</h3>
            <form onSubmit={handleAddProduct}>
              <input 
                placeholder="Nombre del medicamento" 
                value={newProduct.nombre}
                onChange={(e) => setNewProduct({...newProduct, nombre: e.target.value})}
                required 
              />
              <div className="row">
                <input 
                  type="number" step="0.01" placeholder="Precio" 
                  value={newProduct.precio}
                  onChange={(e) => setNewProduct({...newProduct, precio: e.target.value})}
                  required 
                />
                <input 
                  placeholder="Cod. Barras" 
                  value={newProduct.codigo_barras}
                  onChange={(e) => setNewProduct({...newProduct, codigo_barras: e.target.value})}
                />
              </div>
              <div className="row">
                <input 
                  type="number" placeholder="Stock Inicial" 
                  value={newProduct.stock_actual}
                  onChange={(e) => setNewProduct({...newProduct, stock_actual: e.target.value})}
                  required 
                />
                <input 
                  type="number" placeholder="Stock Mínimo" 
                  value={newProduct.stock_minimo}
                  onChange={(e) => setNewProduct({...newProduct, stock_minimo: e.target.value})}
                  required 
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancelar</button>
                <button type="submit">Guardar Producto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial de Ventas */}
      {showHistoryModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content history-modal">
            <div className="modal-header">
              <h3>Historial de Ventas - Nova Salud</h3>
              <button className="close-btn" onClick={() => setShowHistoryModal(false)}>×</button>
            </div>
            <div className="history-list">
              {ventas.length === 0 ? <p>No hay ventas registradas.</p> : (
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>ID Venta</th>
                      <th>Total</th>
                      <th>Detalles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.map(v => (
                      <React.Fragment key={v.id}>
                        <tr className={selectedSale === v.id ? 'active-row' : ''}>
                          <td>{new Date(v.fecha).toLocaleString()}</td>
                          <td>#00{v.id}</td>
                          <td className="total-cell">S/ {v.total}</td>
                          <td>
                            <button className="detail-btn" onClick={() => setSelectedSale(selectedSale === v.id ? null : v.id)}>
                              {selectedSale === v.id ? 'Cerrar' : 'Ver Productos'}
                            </button>
                          </td>
                        </tr>
                        {selectedSale === v.id && (
                          <tr className="detail-row">
                            <td colSpan="4">
                              <div className="detail-container">
                                <ul>
                                  {v.detalles?.map(d => (
                                    <li key={d.id}>
                                      • {d.Producto?.nombre} (x{d.cantidad}) - <strong>S/ {d.subtotal}</strong>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .history-icon-btn {
          background: none;
          color: var(--text-muted);
          padding: 8px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .history-icon-btn:hover {
          background: rgba(255,255,255,0.1);
          color: var(--primary);
        }
        .history-modal {
          max-width: 650px !important;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .close-btn {
          background: none;
          font-size: 2rem;
          color: var(--text-muted);
          padding: 0;
        }
        .history-list {
          max-height: 400px;
          overflow-y: auto;
        }
        .history-table {
          width: 100%;
          border-collapse: collapse;
        }
        .history-table th {
          text-align: left;
          color: var(--text-muted);
          font-size: 0.8rem;
          padding: 10px;
          border-bottom: 1px solid #334155;
        }
        .history-table td {
          padding: 12px 10px;
          font-size: 0.9rem;
          border-bottom: 1px solid #1e293b;
        }
        .total-cell {
          color: var(--accent);
          font-weight: bold;
        }
        .main-layout {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 30px;
        }
        .dashboard {
          padding: 20px;
          min-height: 100vh;
          width: 100vw;
          max-width: 100%;
          overflow-x: hidden;
        }
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 30px;
          margin-bottom: 30px;
          border-radius: 12px;
        }
        .nav-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          font-size: 1.4rem;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .alerts-badge {
          position: relative;
          cursor: pointer;
        }
        .badge-count {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ef4444;
          color: white;
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: bold;
        }
        .logout-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          padding: 5px;
        }
        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 25px;
        }
        .stock-alert-text {
          font-size: 0.85rem;
          color: #f59e0b;
          font-weight: 500;
        }
        .actions {
          display: flex;
          gap: 15px;
        }
        .search-bar {
          display: flex;
          align-items: center;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 0 12px;
        }
        .search-bar input {
          border: none;
          background: transparent;
          width: 250px;
          margin: 0;
        }
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
        }
        .product-card {
          padding: 18px;
          position: relative;
          overflow: hidden;
        }
        .product-card.critical {
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .alert-tag {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          font-size: 0.65rem;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: bold;
        }
        .price {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--primary);
          margin: 8px 0;
        }
        .stock-info {
          margin: 15px 0;
        }
        .sidebar-cart {
          height: calc(100vh - 120px);
          position: sticky;
          top: 20px;
          padding: 25px;
          display: flex;
          flex-direction: column;
        }
        .cart-items {
          flex-grow: 1;
          overflow-y: auto;
          margin: 15px 0;
        }
        .cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #334155;
        }
        .item-name { font-weight: 500; font-size: 0.9rem; }
        .item-qty { color: var(--primary); font-size: 0.8rem; margin-left: 8px; }
        .checkout-btn {
          width: 100%;
          background: var(--accent);
          color: #0f172a;
          font-weight: 700;
        }
        
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          width: 90%;
          max-width: 500px;
          padding: 30px;
        }
        .row { display: flex; gap: 15px; }
        .item-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 5px;
        }
        .item-controls button {
          padding: 4px;
          background: #334155;
        }
        .item-price-remove {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
        }
        .remove-item-btn {
          background: none;
          color: var(--error);
          padding: 0;
        }
        .remove-item-btn:hover {
          background: none;
          box-shadow: none;
          transform: scale(1.2);
        }
        .detail-btn {
          padding: 5px 10px;
          font-size: 0.75rem;
          background: #334155;
        }
        .active-row {
          background: rgba(56, 189, 248, 0.1);
        }
        .detail-container {
          padding: 15px;
          background: #0f172a;
          border-radius: 8px;
          margin: 10px;
        }
        .detail-container ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .detail-container li {
          margin-bottom: 5px;
          color: var(--text-muted);
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          margin-top: 20px;
        }
        .cancel-btn { background: #334155; }
      `}</style>
    </div>
  );
};

export default Dashboard;
