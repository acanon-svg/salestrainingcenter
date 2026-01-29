import React, { useState } from "react";
import { useChatbotTeamData, TeamDataEntry } from "@/hooks/useChatbotTeamData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  FileSpreadsheet,
  Eye,
  Calendar,
  Link as LinkIcon,
  FileJson
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type DataType = "json" | "google_sheet";

interface FormData {
  dataName: string;
  description: string;
  jsonContent: string;
  googleSheetUrl: string;
  dataType: DataType;
}

const isGoogleSheetUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === "docs.google.com" && urlObj.pathname.includes("/spreadsheets/");
  } catch {
    return false;
  }
};

export const TeamDataManager: React.FC = () => {
  const { teamData, isLoading, addTeamData, updateTeamData, deleteTeamData } = useChatbotTeamData();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedData, setSelectedData] = useState<TeamDataEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    dataName: "",
    description: "",
    jsonContent: "",
    googleSheetUrl: "",
    dataType: "json",
  });

  const resetForm = () => {
    setFormData({
      dataName: "",
      description: "",
      jsonContent: "",
      googleSheetUrl: "",
      dataType: "json",
    });
  };

  const handleAdd = async () => {
    if (!formData.dataName.trim()) return;
    
    if (formData.dataType === "json" && !formData.jsonContent.trim()) return;
    if (formData.dataType === "google_sheet" && !formData.googleSheetUrl.trim()) return;

    try {
      let dataContent: Record<string, unknown>;
      
      if (formData.dataType === "json") {
        dataContent = JSON.parse(formData.jsonContent);
      } else {
        // Store Google Sheet URL as a special format the edge function will recognize
        dataContent = {
          __type: "google_sheet",
          url: formData.googleSheetUrl.trim(),
        };
      }
      
      setIsSubmitting(true);
      
      const success = await addTeamData(
        formData.dataName,
        dataContent,
        formData.description
      );

      if (success) {
        setIsAddDialogOpen(false);
        resetForm();
      }
    } catch {
      // JSON parse error is handled in the form validation
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedData || !formData.dataName.trim()) return;
    
    if (formData.dataType === "json" && !formData.jsonContent.trim()) return;
    if (formData.dataType === "google_sheet" && !formData.googleSheetUrl.trim()) return;

    try {
      let dataContent: Record<string, unknown>;
      
      if (formData.dataType === "json") {
        dataContent = JSON.parse(formData.jsonContent);
      } else {
        dataContent = {
          __type: "google_sheet",
          url: formData.googleSheetUrl.trim(),
        };
      }
      
      setIsSubmitting(true);
      
      const success = await updateTeamData(
        selectedData.id,
        formData.dataName,
        dataContent,
        formData.description
      );

      if (success) {
        setIsEditDialogOpen(false);
        setSelectedData(null);
        resetForm();
      }
    } catch {
      // JSON parse error is handled in the form validation
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    await deleteTeamData(deleteId);
    setDeleteId(null);
  };

  const openEditDialog = (data: TeamDataEntry) => {
    setSelectedData(data);
    const isGoogleSheet = (data.data_content as Record<string, unknown>)?.__type === "google_sheet";
    setFormData({
      dataName: data.data_name,
      description: data.description || "",
      jsonContent: isGoogleSheet ? "" : JSON.stringify(data.data_content, null, 2),
      googleSheetUrl: isGoogleSheet ? ((data.data_content as Record<string, unknown>).url as string) || "" : "",
      dataType: isGoogleSheet ? "google_sheet" : "json",
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (data: TeamDataEntry) => {
    setSelectedData(data);
    setIsViewDialogOpen(true);
  };

  const isValidJson = (str: string) => {
    if (!str.trim()) return true;
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-5 w-5 text-primary" />
                Datos del Equipo
              </CardTitle>
              <CardDescription>
                Carga datos del equipo para que el chatbot pueda interpretarlos
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Agregar Datos
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Agregar Datos del Equipo
                  </DialogTitle>
                  <DialogDescription>
                    Agrega datos en formato JSON o vincula un Google Sheet público para que el chatbot pueda interpretarlos.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataName">Nombre del conjunto de datos *</Label>
                    <Input
                      id="dataName"
                      value={formData.dataName}
                      onChange={(e) => setFormData({ ...formData, dataName: e.target.value })}
                      placeholder="Ej: Resultados Q1 2024"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ej: Resultados de ventas del primer trimestre"
                    />
                  </div>
                  
                  <Tabs value={formData.dataType} onValueChange={(v) => setFormData({ ...formData, dataType: v as DataType })}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="json" className="gap-2">
                        <FileJson className="h-4 w-4" />
                        JSON
                      </TabsTrigger>
                      <TabsTrigger value="google_sheet" className="gap-2">
                        <LinkIcon className="h-4 w-4" />
                        Google Sheets
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="json" className="space-y-2 mt-4">
                      <Label htmlFor="jsonContent">Datos en formato JSON *</Label>
                      <Textarea
                        id="jsonContent"
                        value={formData.jsonContent}
                        onChange={(e) => setFormData({ ...formData, jsonContent: e.target.value })}
                        placeholder={`{\n  "ventas_totales": 150000,\n  "meta": 200000,\n  "equipos": [\n    { "nombre": "Equipo A", "ventas": 50000 }\n  ]\n}`}
                        rows={10}
                        className={`font-mono text-sm ${!isValidJson(formData.jsonContent) ? "border-destructive" : ""}`}
                      />
                      {!isValidJson(formData.jsonContent) && formData.jsonContent.trim() && (
                        <p className="text-xs text-destructive">
                          El JSON no es válido. Verifica la sintaxis.
                        </p>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="google_sheet" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="googleSheetUrl">URL del Google Sheet *</Label>
                        <Input
                          id="googleSheetUrl"
                          value={formData.googleSheetUrl}
                          onChange={(e) => setFormData({ ...formData, googleSheetUrl: e.target.value })}
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                        />
                        {formData.googleSheetUrl && !isGoogleSheetUrl(formData.googleSheetUrl) && (
                          <p className="text-xs text-destructive">
                            La URL no parece ser un Google Sheet válido.
                          </p>
                        )}
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-2">
                        <p className="font-medium">📋 Instrucciones:</p>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                          <li>Abre tu Google Sheet</li>
                          <li>Ve a <strong>Archivo → Compartir → Publicar en la web</strong></li>
                          <li>Selecciona la hoja y formato <strong>CSV</strong></li>
                          <li>Copia la URL generada y pégala aquí</li>
                        </ol>
                        <p className="text-xs text-muted-foreground mt-2">
                          También puedes usar la URL normal del Sheet si está configurado como "Cualquier persona con el enlace puede ver".
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAdd}
                    disabled={
                      !formData.dataName.trim() ||
                      (formData.dataType === "json" && (!formData.jsonContent.trim() || !isValidJson(formData.jsonContent))) ||
                      (formData.dataType === "google_sheet" && (!formData.googleSheetUrl.trim() || !isGoogleSheetUrl(formData.googleSheetUrl))) ||
                      isSubmitting
                    }
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Guardar Datos
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {teamData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No hay datos cargados</p>
              <p className="text-sm">
                Agrega datos del equipo para que el chatbot pueda responder preguntas sobre ellos.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {teamData.map((data) => (
                <div
                  key={data.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{data.data_name}</p>
                      {(data.data_content as Record<string, unknown>)?.__type === "google_sheet" && (
                        <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                          Google Sheet
                        </span>
                      )}
                    </div>
                    {data.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {data.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(data.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openViewDialog(data)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(data)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(data.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Datos del Equipo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editDataName">Nombre del conjunto de datos *</Label>
              <Input
                id="editDataName"
                value={formData.dataName}
                onChange={(e) => setFormData({ ...formData, dataName: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editDescription">Descripción</Label>
              <Input
                id="editDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            
            <Tabs value={formData.dataType} onValueChange={(v) => setFormData({ ...formData, dataType: v as DataType })}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="json" className="gap-2">
                  <FileJson className="h-4 w-4" />
                  JSON
                </TabsTrigger>
                <TabsTrigger value="google_sheet" className="gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Google Sheets
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="json" className="space-y-2 mt-4">
                <Label htmlFor="editJsonContent">Datos en formato JSON *</Label>
                <Textarea
                  id="editJsonContent"
                  value={formData.jsonContent}
                  onChange={(e) => setFormData({ ...formData, jsonContent: e.target.value })}
                  rows={10}
                  className={`font-mono text-sm ${!isValidJson(formData.jsonContent) ? "border-destructive" : ""}`}
                />
                {!isValidJson(formData.jsonContent) && formData.jsonContent.trim() && (
                  <p className="text-xs text-destructive">
                    El JSON no es válido. Verifica la sintaxis.
                  </p>
                )}
              </TabsContent>
              
              <TabsContent value="google_sheet" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="editGoogleSheetUrl">URL del Google Sheet *</Label>
                  <Input
                    id="editGoogleSheetUrl"
                    value={formData.googleSheetUrl}
                    onChange={(e) => setFormData({ ...formData, googleSheetUrl: e.target.value })}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                  />
                  {formData.googleSheetUrl && !isGoogleSheetUrl(formData.googleSheetUrl) && (
                    <p className="text-xs text-destructive">
                      La URL no parece ser un Google Sheet válido.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedData(null);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEdit}
              disabled={
                !formData.dataName.trim() ||
                (formData.dataType === "json" && (!formData.jsonContent.trim() || !isValidJson(formData.jsonContent))) ||
                (formData.dataType === "google_sheet" && (!formData.googleSheetUrl.trim() || !isGoogleSheetUrl(formData.googleSheetUrl))) ||
                isSubmitting
              }
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Actualizar Datos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedData?.data_name}</DialogTitle>
            {selectedData?.description && (
              <DialogDescription>{selectedData.description}</DialogDescription>
            )}
          </DialogHeader>
          
          <div className="overflow-auto max-h-[50vh]">
            {(selectedData?.data_content as Record<string, unknown>)?.__type === "google_sheet" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <LinkIcon className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-700 dark:text-green-400">Google Sheet vinculado</span>
                </div>
                <a 
                  href={(selectedData?.data_content as Record<string, unknown>)?.url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
                  {(selectedData?.data_content as Record<string, unknown>)?.url as string}
                </a>
              </div>
            ) : (
              <pre className="bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">
                {selectedData ? JSON.stringify(selectedData.data_content, null, 2) : ""}
              </pre>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar estos datos?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los datos serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
