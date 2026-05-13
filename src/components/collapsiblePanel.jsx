import { useState } from 'react'

function CollapsiblePanel ({ children }) {
    const [isOpen, setIsOpen] = useState(false)

    function togglePanel() {
        setIsOpen(!isOpen)
    }

    return (
        <div style={{display: 'flex', alignItems: 'flex-start', alignSelf: 'flex-start'}}>
            <button onClick={togglePanel}
                    style={{ padding: '1rem 0.5rem',
                            background: '#333',
                            color: 'white',
                            cursor: 'pointer',
                            borderRadius: '0 0 0 6px',
                            // fontSize: '0.8rem',
                            // border: 'none',
                            // zIndex:10
                            }}>
                {isOpen ? '-' : '+'}
            </button>
            {isOpen && <div style={{ flexGrow: 1 }}>{children}</div>}
        </div>        
    )
}

export default CollapsiblePanel