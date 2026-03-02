import { motion } from 'framer-motion';

const Omnitrix = () => {
    return (
        <div className="omnitrix-display">
            <motion.div
                className="omnitrix-ring"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
                {[...Array(8)].map((_, i) => {
                    const angle = (i / 8) * 360;
                    const radius = 190;
                    const x = radius * Math.cos(angle * Math.PI / 180);
                    const y = radius * Math.sin(angle * Math.PI / 180);

                    return (
                        <div
                            key={i}
                            style={{
                                position: 'absolute',
                                width: '8px',
                                height: '8px',
                                background: 'var(--primary-green)',
                                borderRadius: '50%',
                                boxShadow: '0 0 10px var(--primary-green)',
                                left: `calc(50% + ${x}px)`,
                                top: `calc(50% + ${y}px)`,
                                transform: 'translate(-50%, -50%)'
                            }}
                        />
                    );
                })}
                <div className="omnitrix-core"></div>
            </motion.div>
        </div>
    );
};

export default Omnitrix;
