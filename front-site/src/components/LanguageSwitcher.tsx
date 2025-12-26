import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavDropdown } from 'react-bootstrap';

const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const currentLang = i18n.language || 'es';

    return (
        <NavDropdown
            title={
                <span>
                    <i className="fas fa-globe me-1"></i>
                    {currentLang.toUpperCase().split('-')[0]}
                </span>
            }
            id="language-nav-dropdown"
            align="end"
        >
            <NavDropdown.Item
                onClick={() => changeLanguage('es')}
                active={currentLang.startsWith('es')}
            >
                Español
            </NavDropdown.Item>
            <NavDropdown.Item
                onClick={() => changeLanguage('en')}
                active={currentLang.startsWith('en')}
            >
                English
            </NavDropdown.Item>
        </NavDropdown>
    );
};

export default LanguageSwitcher;
