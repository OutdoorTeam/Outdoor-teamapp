import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useStudents } from '../../hooks/useStudents';

interface PersonalizedPlanImporterProps {
  type: 'training' | 'nutrition';
}

export function PersonalizedPlanImporter({ type }: PersonalizedPlanImporterProps) {
  const { students } = useStudents();
  const [selectedUserId, setSelectedUserId] = React.useState<string>('');
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [result, setResult] = React.useState<{ success: boolean; message: string; details?: any } | null>(null);

  const planTypeConfig = {
    training: {
      title: 'Plan de Entrenamiento Personalizado',
      fileType: 'CSV de ejercicios',
      endpoint: '/api/admin/import-personalized-training',
      templateColumns: 'plan_id,alumno_email,dia,ejercicio,series,repeticiones,pausa,intensidad,video_url',
      acceptedFiles: '.csv'
    },
    nutrition: {
      title: 'Plan de Nutrición Personalizado',
      fileType: 'CSV de comidas o PDF',
      endpoint: '/api/admin/import-personalized-nutrition',
      templateColumns: 'plan_id,alumno_email,tipo_comida,nombre_comida,ingredientes,instrucciones,calorias,proteinas_g,carbohidratos_g,grasas_g',
      acceptedFiles: '.csv,.pdf'
    }
  };

  const config = planTypeConfig[type];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const isValidType = type === 'nutrition' 
        ? (selectedFile.type === 'text/csv' || selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.pdf'))
        : (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'));
        
      if (isValidType) {
        setFile(selectedFile);
        setResult(null);
      } else {
        alert(type === 'nutrition' 
          ? 'Por favor selecciona un archivo CSV o PDF válido'
          : 'Por favor selecciona un archivo CSV válido'
        );
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedUserId) {
      alert('Por favor selecciona un usuario y un archivo');
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('userId', selectedUserId);

      const response = await fetch(config.endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: `${config.title} importado exitosamente`,
          details: data
        });
        setFile(null);
        setSelectedUserId('');
        // Reset the file input
        const fileInput = document.getElementById(`${type}File`) as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error(data.error || `Error al importar el ${type === 'training' ? 'plan de entrenamiento' : 'plan de nutrición'}`);
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al importar'
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = type === 'training' 
      ? `plan_id,alumno_email,dia,ejercicio,series,repeticiones,pausa,intensidad,video_url
1,usuario@ejemplo.com,1,Press de banco inclinado,4,10 RIR 2,60-90s,Moderada,https://youtube.com/watch?v=example1
1,usuario@ejemplo.com,1,Vuelos laterales,4,10,60-90s,Moderada,https://youtube.com/watch?v=example2
1,usuario@ejemplo.com,2,Sentadillas,4,15,45-60s,Moderada,https://youtube.com/watch?v=example3`
      : `plan_id,alumno_email,tipo_comida,nombre_comida,ingredientes,instrucciones,calorias,proteinas_g,carbohidratos_g,grasas_g
1,usuario@ejemplo.com,desayuno,Avena con frutas,Avena - 50g Plátano - 1 unidad Arándanos - 50g,Mezclar avena con agua caliente. Agregar frutas picadas,320,12,58,8
1,usuario@ejemplo.com,almuerzo,Pollo con arroz,Pechuga de pollo - 150g Arroz integral - 80g Brócoli - 100g,Cocinar el pollo a la plancha. Hervir el arroz. Cocinar brócoli al vapor,450,35,45,12`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantilla_${type}_personalizado.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="userSelect" className="text-foreground text-base font-medium">
            Seleccionar Usuario
          </Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="bg-input border-border text-foreground">
              <SelectValue placeholder="Selecciona un usuario" />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id.toString()}>
                  {student.nombre} ({student.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor={`${type}File`} className="text-foreground text-base font-medium">
            Archivo del {config.title}
          </Label>
          <p className="text-sm text-muted-foreground mb-2">
            {type === 'nutrition' 
              ? 'Selecciona un archivo CSV con el plan nutricional o un archivo PDF con el plan completo'
              : 'Selecciona un archivo CSV con el plan de entrenamiento personalizado'
            }
          </p>
        </div>
        
        <Input
          id={`${type}File`}
          type="file"
          accept={config.acceptedFiles}
          onChange={handleFileChange}
          className="bg-input border-border text-foreground file:text-primary file:bg-transparent file:border-0 file:font-medium"
        />

        {file && (
          <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-lg">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-foreground font-medium">{file.name}</span>
            <span className="text-sm text-muted-foreground">
              ({(file.size / 1024).toFixed(1)} KB) 
              {file.type === 'application/pdf' && ' - PDF'}
              {(file.type === 'text/csv' || file.name.endsWith('.csv')) && ' - CSV'}
            </span>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleUpload}
            disabled={!file || !selectedUserId || uploading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Importando...' : `Importar ${config.title}`}
          </Button>
          
          {type === 'training' && (
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <FileText className="h-4 w-4 mr-2" />
              Plantilla CSV
            </Button>
          )}
          
          {type === 'nutrition' && (
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <FileText className="h-4 w-4 mr-2" />
              Plantilla CSV
            </Button>
          )}
        </div>
      </div>

      {result && (
        <Alert className={`border-2 ${result.success ? 'border-green-600 bg-green-950/20' : 'border-red-600 bg-red-950/20'}`}>
          <div className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400" />
            )}
            <AlertDescription className={result.success ? 'text-green-300' : 'text-red-300'}>
              {result.message}
              {result.details && (
                <div className="mt-2 text-sm">
                  <div>Registros procesados: {result.details.recordsProcessed || 0}</div>
                  <div>Usuario: {result.details.userName || 'N/A'}</div>
                  {result.details.fileType && (
                    <div>Tipo de archivo: {result.details.fileType}</div>
                  )}
                </div>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="bg-background/50 border border-border rounded-lg p-4">
        <h4 className="font-medium text-foreground mb-2">
          {type === 'nutrition' ? 'Formatos de archivo soportados:' : 'Formato del archivo CSV:'}
        </h4>
        <div className="text-sm text-muted-foreground space-y-2">
          {type === 'nutrition' && (
            <>
              <div>
                <strong>Archivo PDF:</strong> Plan nutricional completo en formato PDF. Se almacenará como documento adjunto.
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <strong>Archivo CSV con las siguientes columnas:</strong>
              </div>
            </>
          )}
          {type === 'training' && (
            <p><strong>Columnas requeridas:</strong></p>
          )}
          <div className="bg-muted p-2 rounded font-mono text-xs overflow-x-auto">
            {config.templateColumns}
          </div>
          <p className="mt-2">
            <strong>Nota:</strong> El plan se asignará automáticamente al usuario seleccionado.
          </p>
        </div>
      </div>
    </div>
  );
}
