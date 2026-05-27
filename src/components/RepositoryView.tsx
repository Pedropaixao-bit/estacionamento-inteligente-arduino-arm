/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Folder, FolderOpen, FileCode, FileText, ChevronRight, 
  ChevronDown, Copy, Check, ExternalLink, Github 
} from 'lucide-react';
import { RepoFile } from '../types';

export default function RepositoryView() {
  const [selectedPath, setSelectedPath] = useState<string>('README.md');
  const [copied, setCopied] = useState<boolean>(false);
  const [expandedDirs, setExpandedDirs] = useState<Record<string, boolean>>({
    'root': true,
    'src': true,
    'simulation': false,
    'docs': false
  });

  const toggleDirectory = (id: string) => {
    setExpandedDirs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Pre-compiled mock git files
  const fileRegistry: Record<string, string> = {
    'README.md': `# Estacionamento Inteligente com IA de Borda em Arquitetura ARM 🚀

Este repositório contém todo o ecossistema embarcado para a automação e controle adaptativo de vagas de estacionamento utilizando transdutores físicos integrados a microcontroladores sob arquiteturas ARM.

## 📋 Estrutura do Repositório

- \`/src\`: Firmware principal compilável para Arduino Mega ou alvos nativos ARM (STM32).
- \`/simulation\`: Scripts e rotinas de depuração de registradores sob ambiente simulado QEMU.
- \`/docs\`: Esquemas elétricos estruturados e diagramas de simbiose operacional lógica.

## 🛠️ Tecnologias Utilizadas

1. **Plataforma de Desenvolvimento**: Ecossistema Arduino (Uno / Mega) e microprocessadores ARM Cortex-M4.
2. **Sensores**: Sensor de proximidade ultrassônico HC-SR04 e Sensor óptico PIR de movimento de infravermelho.
3. **Mecanismo de Atuação**: Servo motor acionado por largura de pulso (PWM) simulando barreira física.
4. **Lógica Embarcada**: Algoritmos heurísticos de IA de bordas baseados em thresholds e Lógica Fuzzy simplificada.
5. **Depuração de Registradores**: GDB Gnu Debugger acoplado com virtualizador ARM QEMU.`,

    'src/EstacionamentoInteligente.ino': `/**
 * @file EstacionamentoInteligente.ino
 * @brief Algoritmo central de controle e tomada de decisão Fuzzy.
 */

#include <Servo.h>
#include "fuzzy_logic.h"

#define PIN_PIR 2
#define PIN_SERVO 9

Servo cancelaServo;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_PIR, INPUT_PULLUP);
  cancelaServo.attach(PIN_SERVO);
  cancelaServo.write(0); // Garante início fechado
}

void loop() {
  // Executa rotina lógica
  bool pirAtivo = (digitalRead(PIN_PIR) == HIGH);
  float fuzzy_p1 = calcularPertinenciaVaga(0); // Lógica de pertinência Fuzzy
  
  if (pirAtivo && obterVagasPreenchidas() < 3) {
    cancelaServo.write(90); // Abre cancela
  } else {
    cancelaServo.write(0);  // Mantém fechada para segurança
  }
  delay(10);
}`,

    'src/fuzzy_logic.h': `/**
 * @file fuzzy_logic.h
 * @brief Funções de pertinência para lógica nebulosa de controle de vaga.
 */

#ifndef FUZZY_LOGIC_H
#define FUZZY_LOGIC_H

#define LIMITE_LIVRE 60.0
#define LIMITE_OCUPADO 40.0

/**
 * Retorna o grau de pertinência do conjunto físico.
 * Grau 1.0 = Totalmente ocupado, Grau 0.0 = Totalmente livre.
 */
float calcularPertinenciaVaga(float distancia) {
  if (distancia <= LIMITE_OCUPADO) {
    return 1.0; // Vaga cheia
  } else if (distancia >= LIMITE_LIVRE) {
    return 0.0; // Vaga livre
  }
  // Interpolação linear Fuzzy para transição na borda de incerteza
  return (LIMITE_LIVRE - distancia) / (LIMITE_LIVRE - LIMITE_OCUPADO);
}

#endif`,

    'src/registers_map.h': `/**
 * @file registers_map.h
 * @brief Definição de registradores e barramentos periféricos para ARM Cortex.
 */

#ifndef REGISTERS_MAP_H
#define REGISTERS_MAP_H

// Endereço de mapeamento de I/O de periféricos na SRAM
#define REG_AHB_GPIO_BASE   0x40020000 
#define REG_GPIO_IDR_OFFSET 0x00000010 // Estado de Leitura de Pinos
#define REG_GPIO_ODR_OFFSET 0x00000014 // Estado de Escrita de Periféricos

// Controle PWM de 16 Bits do temporizador Timer 1 da CPU
#define REG_TIM1_BASE       0x40012C00
#define REG_TIM1_CCR1       (*(volatile unsigned long*)(REG_TIM1_BASE + 0x34)) // Registrador para PWM de Servo

#endif`,

    'simulation/qemu_run_script.sh': `#!/bin/bash
# Executa emulação interativa ARM Cortex-M4 da placa STM32 para depurar IO.

echo "Dando boot na imagem simulada do sistema em ARM no QEMU..."
qemu-system-arm \\
  -M netduinoplus2 \\
  -cpu cortex-m4 \\
  -kernel build/EstacionamentoInteligente.elf \\
  -nographic \\
  -s -S &

echo "Servidor de depuração GDB pronto na porta localhost:1234."
gdb-multiarch build/EstacionamentoInteligente.elf -ex "target remote localhost:1234"`,

    'simulation/arm_cortex_m4_simulation.gdb': `# Arquivo de configuração GDB automática para simulação ARM
# Conecta ao servidor gdb aberto pela instância virtualizada do QEMU

target remote :1234
monitor reset halt
layout regs
break executeDecisionLogic
continue`
  };

  const fileTree: RepoFile = {
    path: 'root',
    name: 'universidade-arm-smartparking',
    type: 'dir',
    children: [
      { path: 'README.md', name: 'README.md', type: 'file' },
      { 
        path: 'src', 
        name: 'src', 
        type: 'dir',
        children: [
          { path: 'src/EstacionamentoInteligente.ino', name: 'EstacionamentoInteligente.ino', type: 'file' },
          { path: 'src/fuzzy_logic.h', name: 'fuzzy_logic.h', type: 'file' },
          { path: 'src/registers_map.h', name: 'registers_map.h', type: 'file' }
        ]
      },
      {
        path: 'simulation',
        name: 'simulation',
        type: 'dir',
        children: [
          { path: 'simulation/qemu_run_script.sh', name: 'qemu_run_script.sh', type: 'file' },
          { path: 'simulation/arm_cortex_m4_simulation.gdb', name: 'arm_cortex_m4_simulation.gdb', type: 'file' }
        ]
      }
    ]
  };

  const renderTree = (node: RepoFile) => {
    if (node.type === 'file') {
      const isSelected = selectedPath === node.path;
      return (
        <button
          id={`repo-file-${node.path.replace(/[/.]/g, '-')}`}
          key={node.path}
          onClick={() => setSelectedPath(node.path)}
          className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left w-full transition ${
            isSelected 
              ? 'bg-accent-gold/20 text-accent-gold border-l-2 border-accent-gold font-medium' 
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          {node.name.endsWith('.md') ? <FileText className="w-4 h-4 text-slate-400" /> : <FileCode className="w-4 h-4 text-blue-400" />}
          <span className="truncate">{node.name}</span>
        </button>
      );
    }

    const isExpanded = expandedDirs[node.path];

    return (
      <div key={node.path} className="flex flex-col gap-0.5">
        <button
          id={`repo-dir-${node.path.replace(/[/.]/g, '-')}`}
          onClick={() => toggleDirectory(node.path)}
          className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left text-slate-200 hover:bg-slate-800/50 hover:text-white transition w-full"
        >
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
          {isExpanded ? <FolderOpen className="w-4 h-4 text-amber-400" /> : <Folder className="w-4 h-4 text-amber-500" />}
          <span className="font-semibold truncate">{node.name}</span>
        </button>
        {isExpanded && node.children && (
          <div className="pl-4 flex flex-col gap-0.5 border-l border-slate-850 ml-3.5 mt-0.5">
            {node.children.map(child => renderTree(child))}
          </div>
        )}
      </div>
    );
  };

  const activeContent = fileRegistry[selectedPath] || '';

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col md:flex-row h-[550px]">
      {/* File Tree sidebar browser */}
      <div className="w-full md:w-64 bg-slate-950 p-4 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col gap-3 shrink-0 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-850 pb-2">
          <div className="flex items-center gap-2">
            <Github className="w-4 h-4 text-white" />
            <span className="text-[11px] font-bold font-display uppercase tracking-wider text-white">GitHub Repository</span>
          </div>
          <span className="text-[9px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-800">PUBLIC</span>
        </div>
        
        <div className="flex-1 flex flex-col gap-1 overflow-y-auto pr-1">
          {renderTree(fileTree)}
        </div>
      </div>

      {/* Code Viewer panel */}
      <div className="flex-1 flex flex-col bg-slate-900/40 overflow-hidden">
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500">PATH:</span>
            <span className="text-xs font-mono text-emerald-400 font-bold">{selectedPath}</span>
          </div>
          
          <button
            id="btn-copy-code"
            onClick={() => handleCopy(activeContent)}
            className="p-1 px-2.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-800/80 text-[10px] font-mono flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto bg-slate-950/20 font-mono text-xs text-slate-300 select-text selection:bg-slate-800">
          <pre className="whitespace-pre-wrap">{activeContent}</pre>
        </div>
      </div>
    </div>
  );
}
