import * as React from 'react';
import { useMeditationSettings } from '../../hooks/useMeditationSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Play, Pause, Settings, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function MeditationView() {
  const { settings, loading, updateSettings } = useMeditationSettings();
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentPhase, setCurrentPhase] = React.useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [timeLeft, setTimeLeft] = React.useState(0);
  const [cycleCount, setCycleCount] = React.useState(0);
  const [totalTime, setTotalTime] = React.useState(0);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout>();
  const audioContextRef = React.useRef<AudioContext>();
  const oscillatorRef = React.useRef<OscillatorNode>();

  // Configuración local temporal para el diálogo
  const [tempSettings, setTempSettings] = React.useState(settings);

  React.useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  React.useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            moveToNextPhase();
            return getPhaseTime(getNextPhase());
          }
          return prev - 1;
        });
        setTotalTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, timeLeft]);

  // Inicializar contexto de audio para sonidos tibetanos
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.log('Web Audio API not supported');
      }
    }

    return () => {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (error) {
          // Oscillator already stopped
        }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const getPhaseTime = (phase: 'inhale' | 'hold' | 'exhale') => {
    switch (phase) {
      case 'inhale': return settings.inhale_seconds;
      case 'hold': return settings.hold_seconds;
      case 'exhale': return settings.exhale_seconds;
      default: return settings.inhale_seconds;
    }
  };

  const getNextPhase = (): 'inhale' | 'hold' | 'exhale' => {
    switch (currentPhase) {
      case 'inhale': return 'hold';
      case 'hold': return 'exhale';
      case 'exhale': return 'inhale';
      default: return 'inhale';
    }
  };

  const moveToNextPhase = () => {
    const nextPhase = getNextPhase();
    setCurrentPhase(nextPhase);
    
    if (nextPhase === 'inhale') {
      setCycleCount(prev => prev + 1);
    }
    
    playTibetanBowlSound(nextPhase);
  };

  // Crear sonido de cuenco tibetano usando síntesis de audio
  const playTibetanBowlSound = (phase: 'inhale' | 'hold' | 'exhale') => {
    if (!settings.sound_enabled || !audioContextRef.current) return;
    
    try {
      // Detener oscilador anterior si existe
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
      }

      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const biquadFilter = audioContext.createBiquadFilter();

      // Conectar nodos
      oscillator.connect(biquadFilter);
      biquadFilter.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configurar frecuencias específicas para cada fase (sonidos tibetanos)
      let frequency: number;
      switch (phase) {
        case 'inhale':
          frequency = 432; // Frecuencia curativa
          break;
        case 'hold':
          frequency = 528; // Frecuencia del amor
          break;
        case 'exhale':
          frequency = 396; // Frecuencia de liberación
          break;
      }

      // Configurar oscilador para simular cuenco tibetano
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      
      // Modulación para simular el timbre del cuenco
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.98, audioContext.currentTime + 0.5);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.02, audioContext.currentTime + 1.0);
      oscillator.frequency.exponentialRampToValueAtTime(frequency, audioContext.currentTime + 1.5);

      // Configurar filtro para simular resonancia
      biquadFilter.type = 'lowpass';
      biquadFilter.frequency.setValueAtTime(frequency * 2, audioContext.currentTime);
      biquadFilter.Q.setValueAtTime(30, audioContext.currentTime);

      // Envolvente de amplitud para simular el golpe del cuenco
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.05, audioContext.currentTime + 0.5);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.0);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 3.0);

      // Iniciar y programar parada
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 3.0);
      
      oscillatorRef.current = oscillator;

    } catch (error) {
      console.error('Error playing Tibetan bowl sound:', error);
    }
  };

  const startMeditation = () => {
    setIsPlaying(true);
    setCurrentPhase('inhale');
    setTimeLeft(settings.inhale_seconds);
    setCycleCount(0);
    setTotalTime(0);
    playTibetanBowlSound('inhale');
  };

  const pauseMeditation = () => {
    setIsPlaying(false);
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch (error) {
        // Oscillator already stopped
      }
    }
  };

  const resetMeditation = () => {
    setIsPlaying(false);
    setCurrentPhase('inhale');
    setTimeLeft(0);
    setCycleCount(0);
    setTotalTime(0);
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch (error) {
        // Oscillator already stopped
      }
    }
  };

  const saveMeditationSession = async () => {
    if (totalTime < 60) return; // Solo guardar sesiones de al menos 1 minuto

    try {
      await fetch('/api/meditation/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration_minutes: Math.floor(totalTime / 60),
          cycles_completed: cycleCount
        })
      });
    } catch (error) {
      console.error('Error saving meditation session:', error);
    }
  };

  const handleSettingsSave = async () => {
    await updateSettings(tempSettings);
    setSettingsOpen(false);
  };

  const getPhaseText = () => {
    switch (currentPhase) {
      case 'inhale': return 'Inhala';
      case 'hold': return 'Mantén';
      case 'exhale': return 'Exhala';
      default: return 'Inhala';
    }
  };

  const getBreathingCircleStyle = () => {
    const baseSize = 120;
    const maxSize = 180;
    const minSize = 80;
    
    if (!isPlaying) return { width: baseSize, height: baseSize };
    
    switch (currentPhase) {
      case 'inhale':
        return { 
          width: maxSize, 
          height: maxSize,
          transition: `all ${settings.inhale_seconds}s ease-in-out`
        };
      case 'hold':
        return { 
          width: maxSize, 
          height: maxSize,
          transition: 'none'
        };
      case 'exhale':
        return { 
          width: minSize, 
          height: minSize,
          transition: `all ${settings.exhale_seconds}s ease-in-out`
        };
      default:
        return { width: baseSize, height: baseSize };
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-foreground">Cargando configuración...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Meditación y Respiración</h1>
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Configuración de Respiración</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="inhale">Segundos de inhalación</Label>
                <Input
                  id="inhale"
                  type="number"
                  min="3"
                  max="15"
                  value={tempSettings.inhale_seconds}
                  onChange={(e) => setTempSettings({...tempSettings, inhale_seconds: parseInt(e.target.value) || 6})}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="hold">Segundos de retención</Label>
                <Input
                  id="hold"
                  type="number"
                  min="0"
                  max="15"
                  value={tempSettings.hold_seconds}
                  onChange={(e) => setTempSettings({...tempSettings, hold_seconds: parseInt(e.target.value) || 5})}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="exhale">Segundos de exhalación</Label>
                <Input
                  id="exhale"
                  type="number"
                  min="3"
                  max="15"
                  value={tempSettings.exhale_seconds}
                  onChange={(e) => setTempSettings({...tempSettings, exhale_seconds: parseInt(e.target.value) || 6})}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sound">Sonidos de cuencos tibetanos</Label>
                <Switch
                  id="sound"
                  checked={tempSettings.sound_enabled === 1}
                  onCheckedChange={(checked) => setTempSettings({...tempSettings, sound_enabled: checked ? 1 : 0})}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSettingsSave} className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1">
                  Guardar
                </Button>
                <Button variant="outline" onClick={() => setSettingsOpen(false)} className="border-border text-foreground">
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-center text-foreground text-xl">Respiración Consciente con Cuencos Tibetanos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Círculo de respiración */}
          <div className="flex flex-col items-center space-y-6">
            <div 
              className="rounded-full bg-gradient-to-r from-primary/30 to-primary/60 border-4 border-primary/50 flex items-center justify-center shadow-2xl"
              style={getBreathingCircleStyle()}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-2">
                  {getPhaseText()}
                </div>
                {timeLeft > 0 && (
                  <div className="text-4xl font-mono text-foreground">
                    {timeLeft}
                  </div>
                )}
              </div>
            </div>

            {/* Instrucciones */}
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Sigue el ritmo del círculo y los sonidos de cuencos tibetanos para una respiración consciente
              </p>
              <div className="text-sm text-foreground">
                Patrón: {settings.inhale_seconds}s inhalar → {settings.hold_seconds}s mantener → {settings.exhale_seconds}s exhalar
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          {(isPlaying || cycleCount > 0) && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-background/50 rounded-lg border border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{cycleCount}</div>
                <div className="text-sm text-muted-foreground">Ciclos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}</div>
                <div className="text-sm text-muted-foreground">Tiempo</div>
              </div>
            </div>
          )}

          {/* Controles */}
          <div className="flex justify-center gap-4">
            {!isPlaying ? (
              <Button
                onClick={startMeditation}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3"
              >
                <Play className="h-5 w-5 mr-2" />
                Comenzar
              </Button>
            ) : (
              <Button
                onClick={pauseMeditation}
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-3"
              >
                <Pause className="h-5 w-5 mr-2" />
                Pausar
              </Button>
            )}
            
            <Button
              onClick={resetMeditation}
              variant="outline"
              className="border-border text-foreground hover:bg-muted px-8 py-3"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Reiniciar
            </Button>
          </div>

          {/* Finalizar sesión */}
          {!isPlaying && totalTime >= 60 && (
            <div className="text-center">
              <Button
                onClick={saveMeditationSession}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                Finalizar y Guardar Sesión
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Beneficios */}
      <Card className="bg-primary/10 border-primary/30 border-2">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-foreground mb-4">Beneficios de la Respiración con Cuencos Tibetanos</h3>
          <div className="grid md:grid-cols-2 gap-4 text-foreground">
            <ul className="space-y-2">
              <li>• Reduce el estrés y la ansiedad profundamente</li>
              <li>• Mejora la concentración y presencia mental</li>
              <li>• Equilibra el sistema nervioso</li>
            </ul>
            <ul className="space-y-2">
              <li>• Sincroniza las ondas cerebrales</li>
              <li>• Libera tensiones emocionales</li>
              <li>• Conecta con la calma interior</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
