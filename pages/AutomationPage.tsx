import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';

export const AutomationPage: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const nodes = [
      { id: '1', label: 'New Email Arrives', type: 'trigger', x: 50, y: 150 },
      { id: '2', label: 'Priority > 80?', type: 'condition', x: 250, y: 150 },
      { id: '3', label: 'Auto Reply (Gemini)', type: 'action', x: 450, y: 50 },
      { id: '4', label: 'Move to Urgent', type: 'action', x: 450, y: 250 },
    ];

    const links = [
      { source: '1', target: '2' },
      { source: '2', target: '3' },
      { source: '2', target: '4' },
    ];

    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "linkGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#EC4899");
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#8B5CF6");

    svg.append("g")
      .selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("d", d => {
          const s = nodes.find(n => n.id === d.source)!;
          const t = nodes.find(n => n.id === d.target)!;
          return `M${s.x + 140},${s.y + 25} C${(s.x + 140 + t.x) / 2},${s.y + 25} ${(s.x + 140 + t.x) / 2},${t.y + 25} ${t.x},${t.y + 25}`;
      })
      .attr("fill", "none")
      .attr("stroke", "url(#linkGradient)")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");

    const nodeGroups = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x},${d.y})`);

    nodeGroups.append("rect")
      .attr("width", 140)
      .attr("height", 50)
      .attr("rx", 12)
      .attr("fill", "#1A1B2E")
      .attr("stroke", d => d.type === 'trigger' ? '#8B5CF6' : d.type === 'condition' ? '#F59E0B' : '#10B981')
      .attr("stroke-width", 1)
      .attr("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.3))");

    nodeGroups.append("text")
      .attr("x", 70)
      .attr("y", 25)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-family", "'Space Grotesk', sans-serif")
      .attr("font-weight", "500")
      .attr("fill", "#E2E8F0")
      .text(d => d.label);

  }, []);

  return (
    <div className="p-8 h-full flex flex-col">
       <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Workflow Builder</h2>
       <div className="bg-glass border border-glass-border rounded-3xl flex-1 flex flex-col backdrop-blur-md overflow-hidden">
            <div className="p-4 border-b border-glass-border flex gap-3">
                 <Button>Add Trigger</Button>
                 <Button variant="secondary">Add Action</Button>
            </div>
            <div className="flex-1 overflow-auto bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5 flex items-center justify-center">
                 <svg ref={svgRef} width="800" height="400"></svg>
            </div>
       </div>
    </div>
  );
};