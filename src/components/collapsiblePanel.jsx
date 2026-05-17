import { useState } from 'react'

function CollapsiblePanel ({ children, hasData }) {
    const [isOpen, setIsOpen] = useState(false)

    function togglePanel() {
        setIsOpen(!isOpen)
    }

    return (
        <div style={{display: 'flex', flexDirection: 'column-reverse', alignItems: 'flex-start', alignSelf: 'flex-start' }}>
            <button onClick={() => hasData && setIsOpen(!isOpen)} style={{
                padding: '1rem 0.5rem',
                background: 'var(--button-bg)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                borderRadius: '6px 0 0 0',
                cursor: hasData ? 'pointer' : 'default',
                opacity: hasData ? 1 : 0.6 }}
            >
                {hasData ? (isOpen ? 'Attribute ▼' : 'Attribute ▲') : 'Keine Daten geladen!'}
            </button>
            {isOpen && hasData && <div>{children}</div>}
        </div>        
    )
}

export default CollapsiblePanel