/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Cpu, Sliders, Gauge, Activity, Sparkles, RefreshCw, 
  ArrowRight, CheckCircle2, XCircle, Info, Database 
} from 'lucide-react';
import { RegistradoresARM, VagaEstacionamento, HistoricoInstrucao } from '../types';

interface SimulatorViewProps {
  sonarDistance1: number;
  setSonarDistance1: (v: number) => void;
  sonarDistance2: number;
  setSonarDistance2: (v: number) => void;
  sonarDistance3: number;
  setSonarDistance3: (v: number) => void;
  pirActive: boolean;
  setPirActive: (v: boolean) => void;
  servoAngle: number;
  setServoAngle: (v: number) => void;
  occupancyThreshold: number;
  setOccupancyThreshold: (v: number) => void;
  vagasDisponiveis: number;
}

export default function SimulatorView({
  sonarDistance1, setSonarDistance1,
  sonarDistance2, setSonarDistance2,
  sonarDistance3, setSonarDistance3,
  pirActive, setPirActive,
  servoAngle, setServoAngle,
  occupancyThreshold, setOccupancyThreshold,
  vagasDisponiveis
}: SimulatorViewProps) {

  const [simClock, setSimClock] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [currentAsmIndex, setCurrentAsmIndex] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>(["Sistema ARM Cortex-M4 inicializado.", "Simulação iniciada."]);

  // Utility to convert decimal to 32-bit hex
  const toHex32 = (num: number): string => {
    const unsignedVal = num >>> 0;
    return `0x${unsignedVal.toString(16).toUpperCase().padStart(8, '0')}`;
  };

  // Compile active ARM registers based on sensor values
  const [registers, setRegisters] = useState<RegistradoresARM>({
    R0: '0x40020000', // IO Port address
    R1: toHex32(sonarDistance1),
    R2: toHex32(sonarDistance2),
    R3: toHex32(sonarDistance3),
    R4: toHex32(pirActive ? 1 : 0),
    R5: toHex32(servoAngle),
    R6: toHex32(vagasDisponiveis),
    R7: '0x00000032', // Threshold limit (50cm, hex: 0x32)
    R12: '0x00000000',
    SP: '0x20003FE0',
    LR: '0x08000F48',
    PC: '0x080002A0',
    APSR: { N: false, Z: false, C: true, V: false }
  });

  // Track sensor activity to update registers dynamically
  useEffect(() => {
    const r1 = Math.round(sonarDistance1);
    const r2 = Math.round(sonarDistance2);
    const r3 = Math.round(sonarDistance3);
    const pirVal = pirActive ? 1 : 0;
    
    // Auto-decide servo opening based on Fuzzy/Threshold Logic
    // IF (pirActive && availableSpots > 0) THEN 90 else 0
    let targetAngle = 0;
    if (pirActive && vagasDisponiveis > 0) {
      targetAngle = 90;
    }
    
    // Smooth angle adjustment
    setServoAngle(targetAngle);

    // Update ARM Core Registers in real-time
    const updatedPC = (0x080002A0 + (currentAsmIndex * 4)).toString(16).toUpperCase().padStart(8, '0');
    
    // Compute Flag state
    const cmpValue = r1 - occupancyThreshold;
    const isZero = cmpValue === 0;
    const isNegative = cmpValue < 0;

    setRegisters(prev => ({
      ...prev,
      R1: toHex32(r1),
      R2: toHex32(r2),
      R3: toHex32(r3),
      R4: toHex32(pirVal),
      R5: toHex32(targetAngle),
      R6: toHex32(vagasDisponiveis),
      R7: toHex32(occupancyThreshold),
      R12: toHex32(simClock % 256),
      PC: `0x${updatedPC}`,
      APSR: {
        ...prev.APSR,
        Z: isZero,
        N: isNegative,
        C: r1 >= occupancyThreshold
      }
    }));
  }, [sonarDistance1, sonarDistance2, sonarDistance3, pirActive, occupancyThreshold, vagasDisponiveis, currentAsmIndex, simClock]);

  // Assembly simulator loop to mimic instruction fetch
  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setSimClock(c => c + 1);
      setCurrentAsmIndex(i => (i + 1) % asmRoutine.length);
    }, 1200);

    return () => clearInterval(timer);
  }, [isRunning]);

  // Add event log on state shifts
  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev.slice(0, 15)]);
  };

  const cleanLogs = () => {
    setLogs(["Registros limpos. Simulação rodando."]);
  };

  const asmRoutine: HistoricoInstrucao[] = [
    { pc: '0x080002A0', asm: 'LDR R0, =0x40020000', explicacao: 'Busca endereço base dos sensores de E/S na memória Flash' },
    { pc: '0x080002A4', asm: 'LDR R1, [R0, #0x00]', explicacao: 'R1 = Canal 0 ADC (Leitura de distância da Vaga 1 em cm)' },
    { pc: '0x080002A8', asm: 'LDR R2, [R0, #0x04]', explicacao: 'R2 = Canal 1 ADC (Leitura de distância da Vaga 2 em cm)' },
    { pc: '0x080002AC', asm: 'LDR R3, [R0, #0x08]', explicacao: 'R3 = Canal 2 ADC (Leitura de distância da Vaga 3 em cm)' },
    { pc: '0x080002B0', asm: 'LDR R4, [R0, #0x12]', explicacao: 'R4 = GPIO Entrada (Estado digital PIR do portão de car/veículos)' },
    { pc: '0x080002B4', asm: 'LDR R7, =OCC_LIMIT',  explicacao: 'R7 = Carrega threshold de vagas configurado (Distância Limite)' },
    { pc: '0x080002B8', asm: 'MOV R6, #0',          explicacao: 'Inicializa contador de vagas livres calculadas em R6 com 0' },
    { pc: '0x080002BC', asm: 'CMP R1, R7',          explicacao: 'Compara R1 (Vaga 1) com threshold R7. Atualiza flags APSR (N, Z)' },
    { pc: '0x080002C0', asm: 'ADDGT R6, R6, #1',    explicacao: 'Se R1 > R7 (Vaga livre), incrementa R6 condicionalmente' },
    { pc: '0x080002C4', asm: 'CMP R2, R7',          explicacao: 'Compara R2 (Vaga 2) com threshold R7' },
    { pc: '0x080002C8', asm: 'ADDGT R6, R6, #1',    explicacao: 'Se R2 > R7 (Vaga livre), incrementa R6 condicionalmente' },
    { pc: '0x080002CC', asm: 'CMP R3, R7',          explicacao: 'Compara R3 (Vaga 3) com threshold R7' },
    { pc: '0x080002D0', asm: 'ADDGT R6, R6, #1',    explicacao: 'Se R3 > R7 (Vaga livre), incrementa R6 condicionalmente' },
    { pc: '0x080002D4', asm: 'CMP R4, #1',          explicacao: 'Compara R4 (PIR de aproximação) com HIGH (1)' },
    { pc: '0x080002D8', asm: 'BNE gate_close',      explicacao: 'Se PIR for ZERO, pula condicionalmente para rotina de fechar cancela' },
    { pc: '0x080002DC', asm: 'CMP R6, #0',          explicacao: 'Compara total de vagas livres (R6) com zero' },
    { pc: '0x080002E0', asm: 'BEQ gate_close',      explicacao: 'Se vagas livres == 0, impede trânsito e salta para fechar cancela' },
    { pc: '0x080002E4', asm: 'MOV R5, #90',         explicacao: 'Caso favorável! Define R5 em 90 graus (abre cancela via PWM)' },
    { pc: '0x080002E8', asm: 'B update_io',         explicacao: 'Salto incondicional para escrita física no barramento' },
    { pc: '0x080002EC', asm: 'MOV R5, #0',          explicacao: 'Rotina gate_close: Define R5 em 0 graus (cancela fechada)' },
    { pc: '0x080002F0', asm: 'STR R5, [R0, #0x20]', explicacao: 'Escreve R5 (PWM do servo) no registrador de hardware da barreira' },
  ];

  return (
    <div id="automaton-sandbox" className="bg-slate-950 text-slate-100 rounded-xl p-4 lg:p-6 border border-slate-800 flex flex-col gap-5 h-full overflow-y-auto">
      
      {/* Simulation Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg text-accent-gold border border-slate-800 shadow-sm">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight font-display text-white">
              Simulador ARM Cortex de Bancada
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              NÚCLEO: Cortex-M4 @16MHz | CICLOS: {simClock * 4} | EM CONTROLE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-play-pause"
            onClick={() => {
              setIsRunning(!isRunning);
              addLog(isRunning ? "Simulação pausada manual." : "Simulação reatidada.");
            }}
            className={`px-3 py-1 rounded text-[11px] font-mono font-medium flex items-center gap-1.5 transition ${
              isRunning 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? "Pausar" : "Executar"}
          </button>
        </div>
      </div>

      {/* 2D Smart Garage Visualizer */}
      <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/80 sim-glow">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800/50 pb-2">
          <span className="text-[11px] font-display uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-accent-gold animate-bounce" /> 1. Planta Física: Estacionamento Inteligente
          </span>
          <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold ${
            vagasDisponiveis > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
          }`}>
            Vagas: {vagasDisponiveis} / 3 Livres
          </span>
        </div>

        {/* 3 Parking slots representation */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { id: 1, dist: sonarDistance1, set: setSonarDistance1, name: "VAGA 01 (HC-SR04-A)" },
            { id: 2, dist: sonarDistance2, set: setSonarDistance2, name: "VAGA 02 (HC-SR04-B)" },
            { id: 3, dist: sonarDistance3, set: setSonarDistance3, name: "VAGA 03 (HC-SR04-C)" }
          ].map((v) => {
            const isOccupied = v.dist < occupancyThreshold;
            return (
              <div 
                id={`vaga-card-${v.id}`}
                key={v.id} 
                className={`p-3 rounded-lg border flex flex-col items-center justify-between gap-2 relative overflow-hidden transition-all duration-300 ${
                  isOccupied 
                    ? 'bg-rose-950/20 border-rose-900/50 text-rose-300' 
                    : 'bg-slate-950/40 border-slate-800 text-slate-300'
                }`}
              >
                {/* Visual Accent */}
                <div className={`absolute top-0 left-0 w-full h-1 ${isOccupied ? 'bg-rose-600' : 'bg-emerald-500'}`} />
                
                <span className="text-[9px] font-mono text-slate-400 text-center uppercase tracking-wide leading-none">{v.name}</span>
                
                {/* Isometric car represent */}
                <div className="py-2 flex flex-col items-center justify-center">
                  {isOccupied ? (
                    <div className="relative animate-pulse">
                      {/* Car Box representing visual vehicle occupancy */}
                      <svg viewBox="0 0 48 24" className="w-12 h-6 text-rose-500 fill-current drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                        <path d="M 6 12 L 12 4 L 36 4 L 42 12 L 44 14 C 44 18 40 20 36 20 L 12 20 C 8 20 4 18 4 14 Z" />
                      </svg>
                      <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                      </span>
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-700/55 rounded-md px-3 py-1 text-[10px] text-slate-500 font-mono tracking-wider">
                      LIVRE
                    </div>
                  )}
                </div>

                <div className="w-full text-center">
                  <span className={`text-xs font-mono font-bold ${isOccupied ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {Math.round(v.dist)} cm
                  </span>
                </div>

                {/* Micro-range controller */}
                <div className="w-full mt-1">
                  <input 
                    id={`sonar-slider-${v.id}`}
                    type="range"
                    min="10"
                    max="150"
                    value={v.dist}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      v.set(val);
                      if ((val < occupancyThreshold) && (v.dist >= occupancyThreshold)) {
                        addLog(`Sensor Vaga ${v.id} detectou veículo em ${val}cm.`);
                      } else if ((val >= occupancyThreshold) && (v.dist < occupancyThreshold)) {
                        addLog(`Vaga ${v.id} agora está disponível. Leitura: ${val}cm.`);
                      }
                    }}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent-gold"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-0.5">
                    <span>10cm</span>
                    <span>150cm</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Access Barrier & Sensor PIR */}
        <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* PIR Interaction Button */}
          <div className="flex flex-col gap-1 w-full md:w-auto">
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest leading-none">Sensor PIR de Aproximação</span>
            <button
              id="btn-trigger-pir"
              onClick={() => {
                const step = !pirActive;
                setPirActive(step);
                addLog(step ? "PIR de entrada detectou chegada de veículo." : "Veículo afastou-se do sensor PIR de entrada.");
              }}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold font-display tracking-wide border cursor-pointer select-none text-center transition ${
                pirActive 
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {pirActive ? "🚙 VEÍCULO DETECTADO (HIGH)" : "💤 AGUARDANDO VEÍCULO (LOW)"}
            </button>
          </div>

          {/* Actuator representation */}
          <div className="flex items-center gap-3 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 w-full md:w-60">
            {/* Animated rotating micro-servomotor in SVG */}
            <div className="relative w-12 h-12 bg-slate-950 rounded border border-slate-800 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 40 40" className="w-10 h-10">
                <circle cx="20" cy="20" r="16" fill="none" stroke="#2a3342" strokeWidth="2" />
                {/* Shifting servo bar based on state angular orientation */}
                <line 
                  x1="20" y1="20" 
                  x2={20 + 14 * Math.cos((90 - servoAngle) * Math.PI / 180)} 
                  y2={20 - 14 * Math.sin((90 - servoAngle) * Math.PI / 180)} 
                  stroke="#c5a059" strokeWidth="3.5" strokeLinecap="round" 
                  className="transition-all duration-500 ease-out" 
                />
                <circle cx="20" cy="20" r="4.5" fill="#f8fafc" />
              </svg>
            </div>

            <div className="flex-1 font-mono text-xs">
              <div className="text-[9px] text-slate-400 tracking-wider">POSIÇÃO SERVO BARRERA</div>
              <div className="text-white font-bold text-sm flex items-center gap-1.5 mt-0.5">
                <span className="text-accent-gold">{servoAngle}°</span>
                <span className={`text-[10px] uppercase tracking-widest py-0.2 px-1 rounded ${
                  servoAngle > 10 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {servoAngle > 10 ? "LIVRE" : "BLOQUEADO"}
                </span>
              </div>
              <p className="text-[9px] text-slate-500 leading-tight mt-0.5 font-sans">
                {servoAngle > 10 
                  ? "Sinal PWM atuando a 90° (Vagas disponíveis)" 
                  : pirActive && vagasDisponiveis === 0 
                    ? "Estacionamento lotado!" 
                    : "Aguardando presença no portão..."
                }
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Fuzzy Setpoints Dynamic Calibration */}
      <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/80 flex flex-col gap-3">
        <span className="text-[11px] font-display uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-accent-gold" /> 2. Ajuste de Tomada de Decisão (Fuzzy Setpoint)
        </span>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Threshold de Vaga Ocupada (Sensibilidade HC-SR04)</span>
              <span className="text-accent-gold font-bold">{occupancyThreshold} cm</span>
            </div>
            <input 
              id="setpoint-slider"
              type="range"
              min="20"
              max="100"
              value={occupancyThreshold}
              onChange={(e) => {
                const val = Number(e.target.value);
                setOccupancyThreshold(val);
                addLog(`Fuzzy-Threshold reconfigurado para ${val}cm de cobertura.`);
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent-gold"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
              <span>20cm (Muito Perto)</span>
              <span>100cm (Grande Distância)</span>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[10px] w-full md:w-56 leading-relaxed text-slate-400">
            <div className="text-slate-300 font-semibold mb-1 text-[11px] font-display flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-accent-gold" /> Pertinência Fuzzy Real
            </div>
            <p>• D &lt; {Math.round(occupancyThreshold - 10)}cm: <span className="text-rose-400">Ocupado (1.0)</span></p>
            <p>• D &gt; {Math.round(occupancyThreshold + 10)}cm: <span className="text-emerald-400">Vazio (0.0)</span></p>
            <p>• Região de Transição: {Math.round(occupancyThreshold - 10)}cm - {Math.round(occupancyThreshold + 10)}cm</p>
          </div>
        </div>
      </div>

      {/* Assembly Instruction Line Tracer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        
        {/* Core Registers map */}
        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/80 flex flex-col gap-3">
          <span className="text-[11px] font-display uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-accent-gold" /> ARM 32-bit Core Registers
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {[
              { r: 'R0', val: registers.R0, desc: 'IO Base PORT' },
              { r: 'R1', val: registers.R1, desc: 'Vaga 1 Dist (cm)', active: sonarDistance1 < occupancyThreshold },
              { r: 'R2', val: registers.R2, desc: 'Vaga 2 Dist (cm)', active: sonarDistance2 < occupancyThreshold },
              { r: 'R3', val: registers.R3, desc: 'Vaga 3 Dist (cm)', active: sonarDistance3 < occupancyThreshold },
              { r: 'R4', val: registers.R4, desc: 'Sensor PIR state', active: pirActive },
              { r: 'R5', val: registers.R5, desc: 'PWM Motor Angle', active: servoAngle > 10 },
              { r: 'R6', val: registers.R6, desc: 'Free Parking spots' },
              { r: 'R7', val: registers.R7, desc: 'Fuzzy threshold' },
              { r: 'SP', val: registers.SP, desc: 'Stack Pointer' },
              { r: 'PC', val: registers.PC, desc: 'Program Counter', active: isRunning },
            ].map((reg) => (
              <div 
                id={`register-row-${reg.r}`}
                key={reg.r} 
                className={`p-2 rounded border flex flex-col gap-0.5 justify-center transition-all ${
                  reg.active 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-bold' 
                    : 'bg-slate-950 border-slate-800/60 text-slate-300'
                }`}
              >
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[11px] font-bold text-slate-400">{reg.r}</span>
                  <span className="text-[8px] text-slate-500 truncate select-none">{reg.desc}</span>
                </div>
                <div className="text-[11px] mt-0.5 self-start tracking-wider">{reg.val}</div>
              </div>
            ))}
          </div>

          {/* Condition flags APSR */}
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between mt-1 text-xs font-mono text-slate-400">
            <span className="text-[9px] uppercase tracking-wider font-semibold">Flags de Status (APSR):</span>
            <div className="flex gap-2.5">
              {[
                { name: 'N', active: registers.APSR.N, title: 'Negative' },
                { name: 'Z', active: registers.APSR.Z, title: 'Zero' },
                { name: 'C', active: registers.APSR.C, title: 'Carry' },
                { name: 'V', active: registers.APSR.V, title: 'Overflow' }
              ].map((f) => (
                <div 
                  id={`flag-chip-${f.name}`}
                  key={f.name} 
                  title={f.title}
                  className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] border transition ${
                    f.active 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                      : 'bg-slate-900 border-slate-800/80 text-slate-600'
                  }`}
                >
                  {f.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Assembly Engine Tracer */}
        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/80 flex flex-col gap-3 min-h-[220px]">
          <span className="text-[11px] font-display uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-accent-gold" /> 3. Desassembly em Tempo Real (Core Tracer)
          </span>

          <div className="flex-1 bg-slate-950 rounded-lg p-2.5 border border-slate-800 overflow-y-auto space-y-1.5 font-mono text-[10px] max-h-[160px] scrollbar-none">
            {asmRoutine.map((item, idx) => {
              const isActive = idx === currentAsmIndex;
              return (
                <div 
                  id={`asm-line-${idx}`}
                  key={idx} 
                  className={`p-1.5 rounded transition ${
                    isActive 
                      ? 'bg-blue-500/10 text-blue-300 border-l-4 border-blue-500 font-bold' 
                      : 'text-slate-400 hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex justify-between items-center text-[9px] mb-0.5 selection:bg-blue-900">
                    <span className="text-slate-500">{item.pc}</span>
                    <span className={`text-[8px] tracking-wider uppercase font-sans ${isActive ? 'text-blue-400' : 'text-slate-600'}`}>
                      {isActive ? "-> BUSCANDO INSTRUÇÃO" : "Aguardando"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className={`${isActive ? 'text-blue-300' : 'text-slate-200'}`}>{item.asm}</span>
                    <span className="text-[8px] text-slate-500 text-right italic font-sans max-w-[150px] truncate">{item.explicacao}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Micro Telemetry Logger */}
          <div className="h-20 bg-slate-950 rounded-lg border border-slate-800/60 p-2 font-mono text-[9px] text-[#A5C] flex flex-col overflow-y-auto gap-0.5 scrollbar-none selection:bg-purple-900">
            <div className="flex justify-between border-b border-slate-800/60 pb-1 mb-1 font-bold text-[#8C5] leading-none">
              <span>SÉRIE TELEMETRIA (DEBUGGER UART)</span>
              <button 
                id="btn-clear-logs"
                onClick={cleanLogs} 
                className="text-[8px] text-slate-500 hover:text-slate-300 uppercase leading-none"
              >
                Limpar
              </button>
            </div>
            {logs.map((log, idx) => (
              <div key={idx} className="truncate text-slate-300 flex items-center gap-1.5">
                <span className="text-slate-600 select-none">&gt;&gt;</span>
                <span>{log}</span>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
