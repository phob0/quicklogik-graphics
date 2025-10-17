import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Layout, Typography, Slider, Row, Col, Card, ColorPicker, Divider, Button, Modal, InputNumber, Checkbox, Select } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, ReloadOutlined, UpOutlined, DownOutlined, LeftOutlined, RightOutlined, RotateRightOutlined, CalculatorOutlined } from '@ant-design/icons';
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
  const [isAreasModalVisible, setIsAreasModalVisible] = useState(false);
  const [diviziuniCustom, setDiviziuniCustom] = useState({}); // {0: 1.2, 1: 0.8, ...}
  
  // State pentru deschideri: {0: {rabatant: true, laterala: 'stanga'}, ...}
  const [deschideri, setDeschideri] = useState({});
  
  // State pentru lățimile cadrelor profilului principal
  const [latimeCadruSus, setLatimeCadruSus] = useState(0.05);
  const [latimeCadruJos, setLatimeCadruJos] = useState(0.05);
  const [latimeCadruStanga, setLatimeCadruStanga] = useState(0.05);
  const [latimeCadruDreapta, setLatimeCadruDreapta] = useState(0.05);
  
  // State pentru lățimea cadrelor separatorilor
  const [latimeCadruSeparatori, setLatimeCadruSeparatori] = useState(0.05);
  
  // State pentru lățimile cadrelor (legacy - pentru compatibilitate)
  const [latimeCadruExterior, setLatimeCadruExterior] = useState(0.05);
  const [latimeCadruInterior, setLatimeCadruInterior] = useState(0.03);
  
  // Stările pentru culorile cadrului
  const [exteriorColor, setExteriorColor] = useState('#000000'); // Negru pentru exterior
  const [interiorColor, setInteriorColor] = useState('#ffffff'); // Alb pentru interior
  
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

    const handleFlipView = useCallback(() => {
        setRotationY(prev => prev + 180); // Întoarce complet pentru a vedea partea opusă
        setRotationX(0); // Resetează rotația X pentru vedere frontală
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

  const handleLatimeCadruExteriorChange = useCallback((value) => {
    setLatimeCadruExterior(value);
  }, []);

  const handleLatimeCadruInteriorChange = useCallback((value) => {
    setLatimeCadruInterior(value);
  }, []);

  // Handler-e pentru lățimile cadrelor profilului principal
  const handleLatimeCadruSusChange = useCallback((value) => {
    setLatimeCadruSus(value);
  }, []);

  const handleLatimeCadruJosChange = useCallback((value) => {
    setLatimeCadruJos(value);
  }, []);

  const handleLatimeCadruStangaChange = useCallback((value) => {
    setLatimeCadruStanga(value);
  }, []);

  const handleLatimeCadruDreaptaChange = useCallback((value) => {
    setLatimeCadruDreapta(value);
  }, []);

  // Handler pentru lățimea cadrelor separatorilor
  const handleLatimeCadruSeparatoriChange = useCallback((value) => {
    setLatimeCadruSeparatori(value);
  }, []);

  // Handler-e pentru modalul de arii
  const showAreasModal = useCallback(() => {
    setIsAreasModalVisible(true);
  }, []);

  const handleAreasModalOk = useCallback(() => {
    setIsAreasModalVisible(false);
  }, []);

  const handleAreasModalCancel = useCallback(() => {
    setIsAreasModalVisible(false);
  }, []);

  // Funcție pentru calculul ariilor
  const calculateAreas = useCallback(() => {
    // Aria profilului total
    const ariaProfil = profilLatime * profilInaltime;
    
    // Aria interioară (fără cadrul exterior)
    const latimeInterioara = profilLatime - latimeCadruStanga - latimeCadruDreapta;
    const inaltimeInterioara = profilInaltime - latimeCadruSus - latimeCadruJos;
    const ariaInterioara = latimeInterioara * inaltimeInterioara;
    
    // Aria geamurilor individuale
    const ariiGeamuri = [];
    let currentX = 0;
    
    for (let i = 0; i < numarDiviziuni; i++) {
      // Determină lățimea geamului
      let latimeGeam;
      if (Object.keys(diviziuniCustom).length > 0 && diviziuniCustom[i]) {
        latimeGeam = diviziuniCustom[i];
      } else {
        // Calcul pentru dimensiuni egale
        const latimeSeparatori = latimeCadruSeparatori * (numarDiviziuni - 1);
        const latimeGeamTotal = latimeInterioara - latimeSeparatori;
        latimeGeam = latimeGeamTotal / numarDiviziuni;
      }
      
      const ariaGeam = latimeGeam * inaltimeInterioara;
      ariiGeamuri.push({
        index: i + 1,
        latime: latimeGeam,
        inaltime: inaltimeInterioara,
        aria: ariaGeam
      });
    }
    
    return {
      ariaProfil,
      ariaInterioara,
      ariiGeamuri,
      latimeInterioara,
      inaltimeInterioara
    };
  }, [profilLatime, profilInaltime, latimeCadruSus, latimeCadruJos, latimeCadruStanga, latimeCadruDreapta, latimeCadruSeparatori, numarDiviziuni, diviziuniCustom]);

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
            
            <Col span={24}>
              <Divider style={{ margin: '12px 0' }} />
              <Text strong style={{ color: '#333', marginBottom: '12px', display: 'block' }}>Lățimi Cadre Profil:</Text>
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <Text style={{ fontSize: '12px' }}>Sus (m):</Text>
                  <InputNumber
                    value={latimeCadruSus}
                    onChange={handleLatimeCadruSusChange}
                    min={0.01}
                    max={0.2}
                    step={0.01}
                    size="small"
                    style={{ width: '100%' }}
                    precision={2}
                  />
                </Col>
                <Col span={12}>
                  <Text style={{ fontSize: '12px' }}>Jos (m):</Text>
                  <InputNumber
                    value={latimeCadruJos}
                    onChange={handleLatimeCadruJosChange}
                    min={0.01}
                    max={0.2}
                    step={0.01}
                    size="small"
                    style={{ width: '100%' }}
                    precision={2}
                  />
                </Col>
                <Col span={12}>
                  <Text style={{ fontSize: '12px' }}>Stânga (m):</Text>
                  <InputNumber
                    value={latimeCadruStanga}
                    onChange={handleLatimeCadruStangaChange}
                    min={0.01}
                    max={0.2}
                    step={0.01}
                    size="small"
                    style={{ width: '100%' }}
                    precision={2}
                  />
                </Col>
                <Col span={12}>
                  <Text style={{ fontSize: '12px' }}>Dreapta (m):</Text>
                  <InputNumber
                    value={latimeCadruDreapta}
                    onChange={handleLatimeCadruDreaptaChange}
                    min={0.01}
                    max={0.2}
                    step={0.01}
                    size="small"
                    style={{ width: '100%' }}
                    precision={2}
                  />
                </Col>
              </Row>
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
        <Header style={{ padding: 0, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0, padding: '0 24px', lineHeight: '64px' }}>
            Vizualizare 3D
          </Title>
          <Button 
            type="primary" 
            icon={<CalculatorOutlined />}
            onClick={showAreasModal}
            style={{ marginRight: '24px' }}
          >
            Calculează Ariile
          </Button>
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
              latimeCadruSus={latimeCadruSus}
              latimeCadruJos={latimeCadruJos}
              latimeCadruStanga={latimeCadruStanga}
              latimeCadruDreapta={latimeCadruDreapta}
              latimeCadruSeparatori={latimeCadruSeparatori}
              latimeCadruExterior={latimeCadruExterior}
              latimeCadruInterior={latimeCadruInterior}
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
              
             {/* Butoane Stânga, Flip și Dreapta */}
             <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
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
               
               {/* Buton Flip Interior/Exterior */}
               <Button 
                 icon={<RotateRightOutlined />} 
                 onClick={handleFlipView}
                 size="large"
                 type="primary"
                 shape="circle"
                 title="Flip Interior/Exterior (180°)"
                 style={{ 
                   width: '50px', 
                   height: '50px',
                   fontSize: '16px',
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
        width={700}
        okText="Aplică"
        cancelText="Anulează"
      >
        <div style={{ marginBottom: '16px' }}>
          <Text type="secondary">
            Ajustează lățimea fiecărei diviziuni (geam + separator) și lățimile cadrelor. 
            Totalul diviziunilor trebuie să fie aproximativ {profilLatime.toFixed(2)}m.
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

        {/* Controale pentru cadrul separatorilor - doar dacă sunt mai multe diviziuni */}
        {numarDiviziuni > 1 && (
          <Card title="Lățimi Cadre Separatare" size="small" style={{ marginTop: '16px' }}>
            <Text type="secondary" style={{ fontSize: '12px', marginBottom: '12px', display: 'block' }}>
              Pentru {numarDiviziuni} diviziuni ai nevoie de {numarDiviziuni - 1} cadru separator
            </Text>
            <Row gutter={16}>
              {Array.from({ length: numarDiviziuni - 1 }, (_, index) => (
                <Col span={8} key={`cadru-${index}`}>
                  <Text strong>Cadru {index + 1} (m):</Text>
                  <InputNumber
                    value={latimeCadruSeparatori}
                    onChange={handleLatimeCadruSeparatoriChange}
                    min={0.01}
                    max={0.1}
                    step={0.01}
                    style={{ width: '100%', marginTop: '8px' }}
                    precision={2}
                  />
                </Col>
              ))}
            </Row>
          </Card>
        )}
        
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

      {/* Modal pentru calculul ariilor */}
      <Modal
        title="Calculul Ariilor"
        open={isAreasModalVisible}
        onOk={handleAreasModalOk}
        onCancel={handleAreasModalCancel}
        width={600}
        okText="Închide"
        cancelText="Anulează"
      >
        {(() => {
          const areas = calculateAreas();
          return (
            <div>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card size="small" style={{ marginBottom: '16px', background: '#f8f9fa' }}>
                    <Title level={5} style={{ margin: 0, color: '#1890ff' }}>📐 Aria Profilului Total</Title>
                    <div style={{ marginTop: '8px' }}>
                      <Text strong style={{ fontSize: '16px' }}>
                        {areas.ariaProfil.toFixed(2)} m²
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {profilLatime.toFixed(2)}m × {profilInaltime.toFixed(2)}m
                      </Text>
                    </div>
                  </Card>
                </Col>
                
                <Col span={24}>
                  <Card size="small" style={{ marginBottom: '16px', background: '#f6ffed' }}>
                    <Title level={5} style={{ margin: 0, color: '#52c41a' }}>🏠 Aria Interioară</Title>
                    <div style={{ marginTop: '8px' }}>
                      <Text strong style={{ fontSize: '16px' }}>
                        {areas.ariaInterioara.toFixed(2)} m²
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {areas.latimeInterioara.toFixed(2)}m × {areas.inaltimeInterioara.toFixed(2)}m
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        (fără cadrul exterior)
                      </Text>
                    </div>
                  </Card>
                </Col>
              </Row>

              <Divider style={{ margin: '16px 0' }}>
                <Text strong style={{ color: '#1890ff' }}>🔍 Ariile Geamurilor</Text>
              </Divider>

              <Row gutter={[16, 12]}>
                {areas.ariiGeamuri.map((geam, index) => (
                  <Col span={12} key={index}>
                    <Card size="small" style={{ background: '#e6f7ff', border: '1px solid #91d5ff' }}>
                      <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
                        Geamul {geam.index}
                      </Title>
                      <div style={{ marginTop: '8px' }}>
                        <Text strong style={{ fontSize: '14px' }}>
                          {geam.aria.toFixed(2)} m²
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {geam.latime.toFixed(2)}m × {geam.inaltime.toFixed(2)}m
                        </Text>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>

              <div style={{ marginTop: '16px', padding: '12px', background: '#f0f0f0', borderRadius: '4px' }}>
                <Text strong>📊 Sumar:</Text>
                <br />
                <Text style={{ fontSize: '12px' }}>
                  • Total geamuri: {areas.ariiGeamuri.reduce((sum, geam) => sum + geam.aria, 0).toFixed(2)} m²
                </Text>
                <br />
                <Text style={{ fontSize: '12px' }}>
                  • Aria cadrelor: {(areas.ariaInterioara - areas.ariiGeamuri.reduce((sum, geam) => sum + geam.aria, 0)).toFixed(2)} m²
                </Text>
                <br />
                <Text style={{ fontSize: '12px' }}>
                  • Procent geam: {((areas.ariiGeamuri.reduce((sum, geam) => sum + geam.aria, 0) / areas.ariaProfil) * 100).toFixed(1)}%
                </Text>
              </div>
            </div>
          );
        })()}
      </Modal>
    </Layout>
  );
}

export default App;