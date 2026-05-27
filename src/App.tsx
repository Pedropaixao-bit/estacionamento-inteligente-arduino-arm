/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Code, Cpu, Award, Milestone, 
  Terminal, ShieldCheck, GraduationCap, Github 
} from 'lucide-react';

import ArticleView from './components/ArticleView';
import SimulatorView from './components/SimulatorView';
import RepositoryView from './components/RepositoryView';
import { ArticleSection } from './types';

export default function App() {
  // Shared state representing physical hardware parameters
  const [sonarDistance1, setSonarDistance1] = useState<number>(120);
  const [sonarDistance2, setSonarDistance2] = useState<number>(35);
  const [sonarDistance3, setSonarDistance3] = useState<number>(140);
  const [pirActive, setPirActive] = useState<boolean>(false);
  const [servoAngle, setServoAngle] = useState<number>(0);
  const [occupancyThreshold, setOccupancyThreshold] = useState<number>(50);

  // Active workspace tabs
  const [activeTab, setActiveTab] = useState<'article' | 'github'>('article');
  
  // Track active section inside the paper
  const [activePaperSection, setActivePaperSection] = useState<ArticleSection>('resumo');

  // Compute parking availability based on live thresholds
  const isSpot1Occupied = sonarDistance1 < occupancyThreshold;
  const isSpot2Occupied = sonarDistance2 < occupancyThreshold;
  const isSpot3Occupied = sonarDistance3 < occupancyThreshold;
  
  const vagasDisponiveis = [isSpot1Occupied, isSpot2Occupied, isSpot3Occupied].filter(o => !o).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-100 p-3 sm:p-5 md:p-6 gap-4">
      
      {/* Upper Academic Portal Title bar */}
      <header className="bg-slate-900 text-white border border-slate-800 rounded-xl flex flex-col md:flex-row items-center justify-between px-6 md:px-8 py-4 shrink-0 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600" />
        
        <div className="flex items-center gap-4 text-center md:text-left mb-3 md:mb-0">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            ARM
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold font-display tracking-tight text-white flex items-center justify-center md:justify-start gap-1.5 uppercase">
              <span>Sistemas Embarcados & Inteligência Artificial</span>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-bold px-1.5 py-0.2 rounded leading-none border border-emerald-500/30">CORTEX-M4</span>
            </h1>
            <p className="text-[10px] md:text-xs text-slate-400 font-mono italic tracking-wider">
              Prof. Dr. Especialista em Arquitetura ARM e IA Aplicada • LAB-EL 2026
            </p>
          </div>
        </div>

        {/* Credentials / Coordinator card */}
        <div className="flex items-center gap-3 bg-slate-950/60 p-2.5 px-4 rounded-lg border border-slate-800/80 max-w-xs justify-center md:justify-start">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs">
            PP
          </div>
          <div className="text-[10px] text-left leading-none">
            <div className="text-slate-200 font-semibold mb-0.5 font-display text-xs">Dr. Pedro Paixão</div>
            <span className="text-slate-400 font-sans">Professor Titular & Pesquisador ARM</span>
          </div>
        </div>
      </header>

      {/* Main tab select toolbar */}
      <nav className="bg-slate-900 border border-slate-800 rounded-xl px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-3.5 shrink-0 shadow-md leading-none">
        
        {/* Navigation tabs */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 gap-1 w-full sm:w-auto">
          <button
            id="tab-btn-article"
            onClick={() => setActiveTab('article')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-semibold tracking-wide transition cursor-pointer select-none ${
              activeTab === 'article'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/45'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Artigo e Simulador de Bancada
          </button>
          
          <button
            id="tab-btn-github"
            onClick={() => setActiveTab('github')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-semibold tracking-wide transition cursor-pointer select-none ${
              activeTab === 'github'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/45'
            }`}
          >
            <Github className="w-4 h-4" />
            Repositório Código GitHub
          </button>
        </div>

        {/* Dynamic status widgets info */}
        <div className="hidden lg:flex items-center gap-6 text-[11px] font-mono text-emerald-400">
          <div className="flex items-center gap-2 border-r border-slate-800 pr-5">
            <Cpu className="w-4 h-4 text-emerald-500" />
            <span>NÚCLEO: <strong className="text-white">CORTEX-M4 (QEMU)</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>ESTADO: <strong className="text-white">SIMULAÇÃO ATIVA</strong></span>
          </div>
        </div>
      </nav>

      {/* Main Workspace Frame container */}
      <main className="flex-grow overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {activeTab === 'article' ? (
            <motion.div
              id="article-pane-wrapper"
              key="article-tab"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col xl:flex-row gap-5 overflow-hidden"
            >
              {/* Left Column - Academic Article */}
              <div className="flex-1 min-w-0 h-full">
                <ArticleView
                  activeSection={activePaperSection}
                  onSectionChange={(sect) => {
                    setActivePaperSection(sect);
                    // Scroll to top of document whenever section switches
                    const docBody = document.getElementById('document-body');
                    if (docBody) docBody.scrollTop = 0;
                  }}
                  sonarDistance1={sonarDistance1}
                  sonarDistance2={sonarDistance2}
                  sonarDistance3={sonarDistance3}
                  pirActive={pirActive}
                  servoAngle={servoAngle}
                  occupancyThreshold={occupancyThreshold}
                  vagasDisponiveis={vagasDisponiveis}
                />
              </div>

              {/* Right Column - CPU & Hardware Simulator */}
              <div className="w-full xl:w-[480px] shrink-0 h-full mt-4 xl:mt-0">
                <SimulatorView
                  sonarDistance1={sonarDistance1}
                  setSonarDistance1={setSonarDistance1}
                  sonarDistance2={sonarDistance2}
                  setSonarDistance2={setSonarDistance2}
                  sonarDistance3={sonarDistance3}
                  setSonarDistance3={setSonarDistance3}
                  pirActive={pirActive}
                  setPirActive={setPirActive}
                  servoAngle={servoAngle}
                  setServoAngle={setServoAngle}
                  occupancyThreshold={occupancyThreshold}
                  setOccupancyThreshold={setOccupancyThreshold}
                  vagasDisponiveis={vagasDisponiveis}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              id="github-pane-wrapper"
              key="github-tab"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col gap-4 overflow-hidden"
            >
              {/* GitHub Repo Title */}
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md">
                <h3 className="text-sm font-bold font-display uppercase tracking-widest text-white flex items-center gap-2">
                  <Github className="w-5 h-5 text-emerald-400" /> Repositório Oficial do Artigo Acadêmico
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-4xl leading-relaxed">
                  Abaixo está estruturado o esquema de arquivos sugerido para repositório do GitHub detalhado na seção do artigo técnico, contendo o firmware compilável (C/C++), as rotinas Fuzzy de pertinência computada nos canais e os scripts de chamada de simulação ARM Cortex-M4 para ferramentas GNU/QEMU de laboratório.
                </p>
                <div className="mt-3.5 flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                  <span className="bg-slate-950 border border-slate-800 p-1 px-2.5 rounded">• branch: main</span>
                  <span className="bg-slate-900 border border-slate-800 p-1 px-2.5 rounded">• commits: 14</span>
                  <span className="bg-slate-950 border border-slate-800 p-1 px-2.5 rounded">• license: Apache-2.0</span>
                </div>
              </div>

              {/* Virtual Code Repo Explorer */}
              <div className="flex-1 overflow-hidden">
                <RepositoryView />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Portal Footer badge */}
      <footer className="bg-slate-900 border border-slate-800 rounded-xl py-3.5 px-6 text-center text-xs text-slate-400 shrink-0 font-light flex flex-col sm:flex-row justify-between items-center gap-2">
        <p>Copyright @ {new Date().getFullYear()} • Plataforma Tecnológica de Estudos Avançados ARM-IA.</p>
        <p className="font-mono text-[10px] bg-slate-950 border border-emerald-800/20 text-emerald-400 px-2.5 py-0.5 rounded leading-none font-semibold">
          PRODUC_ID: EMBED_ARM_FUZZY_2026_SANDBOX
        </p>
      </footer>

    </div>
  );
}
