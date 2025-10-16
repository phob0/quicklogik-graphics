import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Layout, Typography, Slider, Row, Col, Card, ColorPicker, Divider, Button, Modal, InputNumber, Checkbox, Select } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, ReloadOutlined, UpOutlined, DownOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import Fereastra3D from './Fereastra3D';
import './App.css'; 

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

function App() {
  // Stările pentru profilul principal (cadrul zonei)
  const [profilLatime, setProfilLatime] = useState(3.0); // metri
  const [profilInaltime, setProfilInaltime] = useState(2.0); // metri
  const [numarDiviziuni, setNumarDiviziuni] = useState(2); // câte geamuri
  
  // Stările pentru modal și dimensiunile individuale
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [diviziuniCustom, setDiviziuniCustom] = useState({}); // {0: 1.2, 1: 0.8, ...}
  
  // State pentru deschideri: {0: {rabatant: true, laterala: 'stanga'}, ...}
  const [deschideri, setDeschideri] = useState({});
  
  // Stările pentru culorile cadrului
  const [exteriorColor, setExteriorColor] = useState('#333333');
  const [interiorColor, setInteriorColor] = useState('#666666');
  
  // Stările pentru zoom și vizualizare
  const [zoomLevel, setZoomLevel] = useState(3.0);
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  
  // Ref pentru interval-ul de rotire continuă
  const rotationIntervalRef = useRef(null);

  // Debounced handlers pentru performanță
  const handleProfilLatimeChange = useCallback((value) => {
    setProfilLatime(value);
    // Resetează valorile custom când se schimbă lățimea profilului
    setDiviziuniCustom({});
  }, []);
  
  const handleProfilInaltimeChange = useCallback((value) => {
    setProfilInaltime(value);
  }, []);

  const handleDiviziuniChange = useCallback((value) => {
    setNumarDiviziuni(value);
    // Resetează valorile custom când se schimbă numărul de diviziuni
    setDiviziuniCustom({});
  }, []);

  const handleExteriorColorChange = useCallback((color) => {
    setExteriorColor(color.toHexString());
  }, []);

  const handleInteriorColorChange = useCallback((color) => {
    setInteriorColor(color.toHexString());
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.max(1.0, prev - 0.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.min(10.0, prev + 0.5));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(3.0);
    setRotationX(0);
    setRotationY(0);
  }, []);

  const handleZoomChange = useCallback((value) => {
    setZoomLevel(value);
  }, []);

  const handleRotationChange = useCallback((x, y) => {
    setRotationX(x);
    setRotationY(y);
  }, []);

  // Handler-e pentru modal
  const showModal = useCallback(() => {
    // Doar dacă nu avem deja valori custom, inițializează cu valori egale
    if (Object.keys(diviziuniCustom).length === 0) {
      const latimeGeamDefault = (profilLatime - 0.08 * (numarDiviziuni + 1)) / numarDiviziuni;
      const initialCustom = {};
      for (let i = 0; i < numarDiviziuni; i++) {
        initialCustom[i] = latimeGeamDefault;
      }
      setDiviziuniCustom(initialCustom);
    }
    setIsModalVisible(true);
  }, [profilLatime, numarDiviziuni, diviziuniCustom]);

  const handleModalOk = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const handleModalCancel = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const handleDiviziuneChange = useCallback((index, value) => {
    setDiviziuniCustom(prev => ({
      ...prev,
      [index]: value
    }));
  }, []);

  const handleAutoAdjust = useCallback(() => {
    const currentValues = Object.values(diviziuniCustom);
    const currentTotal = currentValues.reduce((sum, val) => sum + (val || 0), 0);
    
    if (currentTotal > 0) {
      // Ajustează proporțional toate valorile
      const scaleFactor = profilLatime / currentTotal;
      const adjustedValues = {};
      
      Object.keys(diviziuniCustom).forEach(key => {
        adjustedValues[key] = (diviziuniCustom[key] || 0) * scaleFactor;
      });
      
      setDiviziuniCustom(adjustedValues);
    }
  }, [diviziuniCustom, profilLatime]);

  // Handler-e pentru deschideri
  const handleRabatantChange = useCallback((index, checked) => {
    setDeschideri(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        rabatant: checked
      }
    }));
  }, []);

  const handleLateralaChange = useCallback((index, value) => {
    setDeschideri(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        laterala: value
      }
    }));
  }, []);

  // Funcție pentru a opri rotirea continuă
  const stopRotation = useCallback(() => {
    if (rotationIntervalRef.current) {
      clearInterval(rotationIntervalRef.current);
      rotationIntervalRef.current = null;
    }
  }, []);

  // Funcție pentru a începe rotirea continuă
  const startRotation = useCallback((direction) => {
    // Oprește orice rotire existentă
    stopRotation();
    
    // Începe rotirea continuă
    rotationIntervalRef.current = setInterval(() => {
      switch (direction) {
        case 'up':
          setRotationX(prev => Math.max(-Math.PI/4, prev - 0.05));
          break;
        case 'down':
          setRotationX(prev => Math.min(Math.PI/4, prev + 0.05));
          break;
        case 'left':
          setRotationY(prev => prev - 0.05);
          break;
        case 'right':
          setRotationY(prev => prev + 0.05);
          break;
        default:
          break;
      }
    }, 50); // 20 FPS pentru rotire fluidă
  }, [stopRotation]);

  // Handler-e pentru mouse events
  const handleRotateUp = useCallback(() => startRotation('up'), [startRotation]);
  const handleRotateDown = useCallback(() => startRotation('down'), [startRotation]);
  const handleRotateLeft = useCallback(() => startRotation('left'), [startRotation]);
  const handleRotateRight = useCallback(() => startRotation('right'), [startRotation]);

  // Cleanup la deconectarea componentului
  useEffect(() => {
    return () => {
      stopRotation();
    };
  }, [stopRotation]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        breakpoint="lg" 
        collapsedWidth="0" 
        width={300}
        theme="light"
        style={{ 
          background: '#fafafa',
          overflowY: 'auto',
          overflowX: 'hidden',
          maxHeight: '100vh'
        }}
      >
        <div style={{ 
          padding: '16px', 
          textAlign: 'center', 
          borderBottom: '1px solid #e8e8e8',
          background: '#fff',
          marginBottom: '16px'
        }}>
          <Title level={4} style={{ margin: 0, color: '#333' }}>
            Configurator Termopane
          </Title>
        </div>
        
        <Card 
          title="Profil Principal" 
          style={{ 
            margin: 16, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: '8px'
          }}
          headStyle={{ background: '#f8f9fa', borderRadius: '8px 8px 0 0' }}
        >
          <Row gutter={[0, 16]}>
            <Col span={24}>
              <Text strong style={{ color: '#333' }}>Lățime Profil (m): {profilLatime.toFixed(2)}</Text>
              <Slider 
                min={1.0} 
                max={12.0} 
                step={0.1} 
                value={profilLatime} 
                onChange={handleProfilLatimeChange} 
              />
            </Col>
            <Col span={24}>
              <Text strong style={{ color: '#333' }}>Înălțime Profil (m): {profilInaltime.toFixed(2)}</Text>
              <Slider 
                min={1.0} 
                max={4.0} 
                step={0.1} 
                value={profilInaltime} 
                onChange={handleProfilInaltimeChange} 
              />
            </Col>
          </Row>
        </Card>

        <Card 
          title="Diviziuni" 
          style={{ 
            margin: 16, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: '8px'
          }}
          headStyle={{ background: '#f8f9fa', borderRadius: '8px 8px 0 0' }}
        >
          <Row gutter={[0, 16]}>
            <Col span={24}>
              <Text strong style={{ color: '#333' }}>Numărul de Geamuri: {numarDiviziuni}</Text>
              <Slider 
                min={1} 
                max={10} 
                step={1} 
                value={numarDiviziuni} 
                onChange={handleDiviziuniChange} 
                marks={{
                  1: '1',
                  2: '2', 
                  3: '3',
                  4: '4',
                  5: '5',
                  6: '6',
                  7: '7',
                  8: '8',
                  9: '9',
                  10: '10'
                }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Profilul va fi împărțit în {numarDiviziuni} geamuri
              </Text>
            </Col>
            <Col span={24}>
              <Button 
                type="primary" 
                onClick={showModal}
                style={{ width: '100%', marginTop: '8px' }}
                size="small"
              >
                Personalizează Diviziuni
              </Button>
            </Col>
          </Row>
        </Card>

        <Divider style={{ margin: '16px 0', borderColor: '#d9d9d9' }} />
        
        <Card 
          title="Controale Vizualizare" 
          style={{ 
            margin: 16, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: '8px'
          }}
          headStyle={{ background: '#f8f9fa', borderRadius: '8px 8px 0 0' }}
        >
          <Row gutter={[8, 16]}>
            <Col span={24}>
              <Text strong style={{ color: '#333' }}>Zoom: {zoomLevel.toFixed(1)}x</Text>
              <Slider 
                min={1.0} 
                max={10.0} 
                step={0.1} 
                value={zoomLevel} 
                onChange={handleZoomChange}
                style={{ marginTop: 8 }}
              />
            </Col>
            <Col span={8}>
              <Button 
                icon={<ZoomInOutlined />} 
                onClick={handleZoomIn}
                style={{ width: '100%' }}
                size="small"
              >
                Zoom In
              </Button>
            </Col>
            <Col span={8}>
              <Button 
                icon={<ZoomOutOutlined />} 
                onClick={handleZoomOut}
                style={{ width: '100%' }}
                size="small"
              >
                Zoom Out
              </Button>
            </Col>
            <Col span={8}>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleZoomReset}
                style={{ width: '100%' }}
                size="small"
              >
                Reset
              </Button>
            </Col>
          </Row>
          
        </Card>

        <Divider style={{ margin: '16px 0', borderColor: '#d9d9d9' }} />
        
        <Card 
          title="Setări Culori" 
          style={{ 
            margin: 16, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: '8px'
          }}
          headStyle={{ background: '#f8f9fa', borderRadius: '8px 8px 0 0' }}
        >
          <Row gutter={[0, 16]}>
            <Col span={24}>
              <Text strong style={{ color: '#333' }}>Exterior:</Text>
              <div style={{ marginTop: 8 }}>
                <ColorPicker 
                  value={exteriorColor}
                  onChange={handleExteriorColorChange}
                  showText
                  style={{ width: '100%' }}
                />
              </div>
            </Col>
            <Col span={24}>
              <Text strong style={{ color: '#333' }}>Interior:</Text>
              <div style={{ marginTop: 8 }}>
                <ColorPicker 
                  value={interiorColor}
                  onChange={handleInteriorColorChange}
                  showText
                  style={{ width: '100%' }}
                />
              </div>
            </Col>
          </Row>
        </Card>

      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: '#fff' }}>
          <Title level={3} style={{ margin: 0, padding: '0 24px', lineHeight: '64px' }}>
            Vizualizare 3D
          </Title>
        </Header>
        <Content style={{ margin: '24px 16px 0' }}>
          <div style={{ padding: 24, minHeight: 360, background: '#fff' }}>
            {/* Componenta 3D primește parametrii dinamici */}
            <Fereastra3D 
              profilLatime={profilLatime}
              profilInaltime={profilInaltime}
              numarDiviziuni={numarDiviziuni}
              diviziuniCustom={diviziuniCustom}
              deschideri={deschideri}
              culoareExterior={exteriorColor}
              culoareInterior={interiorColor}
              zoomLevel={zoomLevel}
              rotationX={rotationX}
              rotationY={rotationY}
              onRotationChange={handleRotationChange}
            />
            
            {/* Butoane de control rotire sub ecranul 3D */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              marginTop: '20px',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {/* Buton Sus */}
              <Button 
                icon={<UpOutlined />} 
                onMouseDown={handleRotateUp}
                onMouseUp={stopRotation}
                onMouseLeave={stopRotation}
                size="large"
                shape="circle"
                title="Rotire în sus (ține apăsat)"
                style={{ 
                  width: '50px', 
                  height: '50px',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
              
              {/* Butoane Stânga și Dreapta */}
              <div style={{ display: 'flex', gap: '60px', alignItems: 'center' }}>
                <Button 
                  icon={<LeftOutlined />} 
                  onMouseDown={handleRotateLeft}
                  onMouseUp={stopRotation}
                  onMouseLeave={stopRotation}
                  size="large"
                  shape="circle"
                  title="Rotire la stânga (ține apăsat)"
                  style={{ 
                    width: '50px', 
                    height: '50px',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                />
                <Button 
                  icon={<RightOutlined />} 
                  onMouseDown={handleRotateRight}
                  onMouseUp={stopRotation}
                  onMouseLeave={stopRotation}
                  size="large"
                  shape="circle"
                  title="Rotire la dreapta (ține apăsat)"
                  style={{ 
                    width: '50px', 
                    height: '50px',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                />
              </div>
              
              {/* Buton Jos */}
              <Button 
                icon={<DownOutlined />} 
                onMouseDown={handleRotateDown}
                onMouseUp={stopRotation}
                onMouseLeave={stopRotation}
                size="large"
                shape="circle"
                title="Rotire în jos (ține apăsat)"
                style={{ 
                  width: '50px', 
                  height: '50px',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
            </div>
          </div>
        </Content>
      </Layout>
      
      {/* Modal pentru personalizarea dimensiunilor diviziunilor */}
      <Modal
        title="Personalizează Dimensiunile Diviziunilor"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={500}
        okText="Aplică"
        cancelText="Anulează"
      >
        <div style={{ marginBottom: '16px' }}>
          <Text type="secondary">
            Ajustează lățimea fiecărei diviziuni (geam + separator). Totalul trebuie să fie aproximativ {profilLatime.toFixed(2)}m.
          </Text>
          {Object.keys(diviziuniCustom).length > 0 && (
            <div style={{ marginTop: '8px', padding: '8px', background: '#e6f7ff', borderRadius: '4px', border: '1px solid #91d5ff' }}>
              <Text style={{ color: '#1890ff', fontSize: '12px' }}>
                ✓ Dimensiuni custom active - valorile sunt păstrate
              </Text>
            </div>
          )}
        </div>
        
        <Row gutter={[16, 16]}>
          {Array.from({ length: numarDiviziuni }, (_, index) => (
            <Col span={24} key={index}>
              <Card size="small" style={{ marginBottom: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>Diviziunea {index + 1}:</Text>
                </div>
                
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <div style={{ marginBottom: '8px' }}>
                      <Text>Lățime (m):</Text>
                    </div>
                    <InputNumber
                      value={diviziuniCustom[index] || 0}
                      onChange={(value) => handleDiviziuneChange(index, value)}
                      min={0.1}
                      max={profilLatime - 0.1}
                      step={0.1}
                      style={{ width: '100%' }}
                      addonAfter="m"
                      precision={2}
                    />
                  </Col>
                  
                  <Col span={12}>
                    <div style={{ marginBottom: '8px' }}>
                      <Text>Deschideri:</Text>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <Checkbox
                        checked={deschideri[index]?.rabatant || false}
                        onChange={(e) => handleRabatantChange(index, e.target.checked)}
                      >
                        Rabatant (deschidere sus)
                      </Checkbox>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Text style={{ fontSize: '12px' }}>Laterală:</Text>
                        <Select
                          value={deschideri[index]?.laterala || 'none'}
                          onChange={(value) => handleLateralaChange(index, value)}
                          style={{ minWidth: '80px' }}
                          size="small"
                        >
                          <Option value="none">-</Option>
                          <Option value="stanga">Stânga</Option>
                          <Option value="dreapta">Dreapta</Option>
                        </Select>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
        
        <div style={{ marginTop: '16px', padding: '12px', background: '#f0f0f0', borderRadius: '4px' }}>
          <Text strong>Total: </Text>
          <Text style={{ color: '#1890ff' }}>
            {Object.values(diviziuniCustom).reduce((sum, val) => sum + (val || 0), 0).toFixed(2)}m
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Lățimea profilului: {profilLatime.toFixed(2)}m
          </Text>
          {(() => {
            const total = Object.values(diviziuniCustom).reduce((sum, val) => sum + (val || 0), 0);
            const difference = total - profilLatime;
            if (difference > 0.01) {
              return (
                <div style={{ marginTop: '8px', padding: '8px', background: '#fff2e8', borderRadius: '4px', border: '1px solid #ffd591' }}>
                  <Text style={{ color: '#fa8c16', fontSize: '12px' }}>
                    ⚠️ Totalul depășește lățimea profilului cu {difference.toFixed(2)}m
                  </Text>
                </div>
              );
            } else if (Math.abs(difference) < 0.01) {
              return (
                <div style={{ marginTop: '8px', padding: '8px', background: '#f6ffed', borderRadius: '4px', border: '1px solid #b7eb8f' }}>
                  <Text style={{ color: '#52c41a', fontSize: '12px' }}>
                    ✓ Totalul se potrivește perfect cu lățimea profilului
                  </Text>
                </div>
              );
            }
            return null;
          })()}
        </div>
        
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <Button 
            type="dashed" 
            onClick={handleAutoAdjust}
            style={{ marginBottom: '8px' }}
          >
            🔧 Ajustează automat să se potrivească cu profilul
          </Button>
          <div style={{ fontSize: '11px', color: '#666' }}>
            Această funcție va scala proporțional toate diviziunile
          </div>
        </div>
      </Modal>
    </Layout>
  );
}

export default App;