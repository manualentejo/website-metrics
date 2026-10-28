"use client";

import "rakibulism-ui/styles";
import "./theme.css";
import { Accordion, AccordionItem, Badge, Button, Card, Input, Select, Switch, Tab, TabList, TabPanel, Tabs, ToastProvider, Tooltip, useToast } from "rakibulism-ui";

function ToastButton() {
  const { show } = useToast();
  return <Button variant="secondary" onClick={() => show({ title: "Análise concluída", variant: "success" })}>Toast</Button>;
}

export default function Demo() {
  return (
    <ToastProvider>
      <div className="ui-mono space-y-6 p-8">
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>rakibulism-ui — teste</h1>
        <div className="flex flex-wrap gap-2">
          <Button>Primário</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Excluir</Button>
          <Button isLoading>Salvando</Button>
          <ToastButton />
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>Neutro</Badge>
          <Badge variant="success">No ar</Badge>
          <Badge variant="warning">Em andamento</Badge>
          <Badge variant="error">Ruim</Badge>
        </div>
        <div className="grid max-w-md gap-3">
          <Input placeholder="seusite.com" />
          <Select><option>Sem workspace</option></Select>
          <Switch label="Relatório semanal" />
        </div>
        <Card><p>Card de exemplo</p></Card>
        <Tooltip content="Dica de ferramenta"><Button variant="ghost">Passe o mouse</Button></Tooltip>
        <Tabs defaultValue="a">
          <TabList><Tab value="a">Meus dados</Tab><Tab value="b">Relatório</Tab></TabList>
          <TabPanel value="a">Painel A</TabPanel>
          <TabPanel value="b">Painel B</TabPanel>
        </Tabs>
        <Accordion>
          <AccordionItem value="d" title="Detalhes">Conteúdo</AccordionItem>
        </Accordion>
      </div>
    </ToastProvider>
  );
}
