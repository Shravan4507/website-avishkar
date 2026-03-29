// @ts-nocheck
import { useEffect, useRef } from 'react';

const useCanvasCursor = (canvasRef) => {
    // Refs for all internal "global" state
    const ctxRef = useRef(null);
    const posRef = useRef({ x: 0, y: 0 });
    const linesRef = useRef([]);
    const frameRef = useRef(0);
    const runningRef = useRef(false);
    const rafIdRef = useRef(null);

    const E = {
        debug: false,
        friction: 0.5,
        trails: 20,
        size: 50,
        dampening: 0.25,
        tension: 0.98,
    };

    function Node() {
        this.x = 0;
        this.y = 0;
        this.vy = 0;
        this.vx = 0;
    }

    function Line(config) {
        this.spring = config.spring + 0.1 * Math.random() - 0.02;
        this.friction = E.friction + 0.01 * Math.random() - 0.002;
        this.nodes = [];
        for (let i = 0; i < E.size; i++) {
            const t = new Node();
            t.x = posRef.current.x;
            t.y = posRef.current.y;
            this.nodes.push(t);
        }
    }

    Line.prototype.update = function () {
        let spring = this.spring;
        let t = this.nodes[0];
        
        t.vx += (posRef.current.x - t.x) * spring;
        t.vy += (posRef.current.y - t.y) * spring;

        for (let i = 0, len = this.nodes.length; i < len; i++) {
            t = this.nodes[i];
            if (i > 0) {
                const prev = this.nodes[i - 1];
                t.vx += (prev.x - t.x) * spring;
                t.vy += (prev.y - t.y) * spring;
                t.vx += prev.vx * E.dampening;
                t.vy += prev.vy * E.dampening;
            }
            t.vx *= this.friction;
            t.vy *= this.friction;
            t.x += t.vx;
            t.y += t.vy;
            spring *= E.tension;
        }
    };

    Line.prototype.draw = function(ctx) {
        let n = this.nodes[0].x;
        let i = this.nodes[0].y;
        ctx.beginPath();
        ctx.moveTo(n, i);
        let a;
        for (a = 1; a < this.nodes.length - 2; a++) {
            const e = this.nodes[a];
            const t = this.nodes[a + 1];
            n = 0.5 * (e.x + t.x);
            i = 0.5 * (e.y + t.y);
            ctx.quadraticCurveTo(e.x, e.y, n, i);
        }
        const e = this.nodes[a];
        const t = this.nodes[a + 1];
        ctx.quadraticCurveTo(e.x, e.y, t.x, t.y);
        ctx.stroke();
        ctx.closePath();
    };

    const GDG_COLORS = ['#4285f4', '#34a853', '#f9ab00', '#ea4335'];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctxRef.current = ctx;
        runningRef.current = true;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const onTouch = (e) => {
            if (e.touches.length > 0) {
                posRef.current.x = e.touches[0].clientX;
                posRef.current.y = e.touches[0].clientY;
            }
        };

        const onMouseMove = (e) => {
            posRef.current.x = e.clientX;
            posRef.current.y = e.clientY;
            
            // On first move, initialize lines
            if (linesRef.current.length === 0) {
                for (let i = 0; i < E.trails; i++) {
                    linesRef.current.push(new Line({ spring: 0.4 + (i / E.trails) * 0.025 }));
                }
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchmove', onTouch);
        window.addEventListener('touchstart', onTouch);

        const render = () => {
            if (!runningRef.current) return;

            ctx.globalCompositeOperation = 'source-over';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'lighter';
            ctx.lineWidth = 1;

            linesRef.current.forEach((line, i) => {
                // Assign official GDG colors from the provided palette
                ctx.strokeStyle = GDG_COLORS[i % GDG_COLORS.length] + '66'; // 0.4 alpha
                line.update();
                line.draw(ctx);
            });

            rafIdRef.current = window.requestAnimationFrame(render);
        };

        render();

        return () => {
            runningRef.current = false;
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onTouch);
            window.removeEventListener('touchstart', onTouch);
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        };
    }, [canvasRef]);
};

export default useCanvasCursor;
