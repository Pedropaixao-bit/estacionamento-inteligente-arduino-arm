/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VagaEstacionamento {
  id: number;
  nome: string;
  distancia: number; // 0 a 400 cm (HC-SR04)
  ocupada: boolean;  // Se distancia < threshold
}

export interface RegistradoresARM {
  R0: string; // Endereço Base do Bloco de I/O
  R1: string; // Valor lido ADC / Distancia Vaga 1 (HC-SR04)
  R2: string; // Valor lido ADC / Distancia Vaga 2 (HC-SR04)
  R3: string; // Valor lido ADC / Distancia Vaga 3 (HC-SR04)
  R4: string; // Estado Sensor PIR Presença (0 ou 1) / RFID
  R5: string; // Posição de Saída PWM (Servo Motor) - convertido para largura de pulso
  R6: string; // Vagas Disponíveis Calculadas (Soma)
  R7: string; // Variável Auxiliar / Margem Fuzzy
  R12: string; // Scratch Register / Temporizador
  SP: string;  // Stack Pointer (Ex: 0x20003FE0)
  LR: string;  // Link Register (Ex: 0x08000F48)
  PC: string;  // Program Counter (Ex: 0x080002AC)
  APSR: {
    N: boolean; // Flag Negativo
    Z: boolean; // Flag Zero
    C: boolean; // Flag Carry
    V: boolean; // Flag Overflow
  };
}

export interface HistoricoInstrucao {
  pc: string;
  asm: string;
  explicacao: string;
}

export interface RepoFile {
  path: string;
  name: string;
  type: 'file' | 'dir';
  content?: string;
  children?: RepoFile[];
}

export type ArticleSection = 
  | 'resumo'
  | 'introducao'
  | 'referencial'
  | 'metodologia'
  | 'desenvolvimento'
  | 'resultados'
  | 'conclusao'
  | 'referencias'
  | 'github';
