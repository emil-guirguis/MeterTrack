import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { BreadcrumbItem } from '../../types/ui';
import './Breadcrumb.css';

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  separator?: string;
  maxItems?: number;
  showHome?: boolean;
  homeIcon?: string;
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items = [],
  separator = '/',
  maxItems = 5,
  showHome = true,
  homeIcon = '🏠',
  className = ''
}) => {
  const location = useLocation();

  // Generate breadcrumbs from current route if no items provided
  const generateBreadcrumbsFromRoute = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(segment => segment);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Add home if enabled
    if (showHome) {
      breadcrumbs.push({
        label: 'Home',
        path: '/dashboard',
        icon: homeIcon
      });
    }

    // Generate breadcrumbs from path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Convert segment to readable label
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        label,
        path: index === pathSegments.length - 1 ? undefined : currentPath // Last item has no path
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items.length > 0 ? items : generateBreadcrumbsFromRoute();

  // Handle max items with ellipsis
  const displayItems = breadcrumbItems.length > maxItems 
    ? [
        ...breadcrumbItems.slice(0, 1), // First item
        { label: '...', path: undefined }, // Ellipsis
        ...breadcrumbItems.slice(-maxItems + 2) // Last items
      ]
    : breadcrumbItems;

  if (displayItems.length <= 1) {
    return null; // Don't show breadcrumbs if only one item
  }

  return (
    <nav 
      className={`breadcrumb ${className}`}
      aria-label="Breadcrumb navigation"
    >
      <ol className="breadcrumb__list">
        {displayItems.map((item, index) => (
          <li key={index} className="breadcrumb__item">
            {item.path && item.label !== '...' ? (
              <Link 
                to={item.path} 
                className="breadcrumb__link"
                aria-current={index === displayItems.length - 1 ? 'page' : undefined}
              >
                {item.icon && (
                  <span className="breadcrumb__icon" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span className="breadcrumb__label">{item.label}</span>
              </Link>
            ) : (
              <span 
                className={`breadcrumb__current ${item.label === '...' ? 'breadcrumb__ellipsis' : ''}`}
                aria-current={index === displayItems.length - 1 ? 'page' : undefined}
              >
                {item.icon && item.label !== '...' && (
                  <span className="breadcrumb__icon" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span className="breadcrumb__label">{item.label}</span>
              </span>
            )}
            
            {index < displayItems.length - 1 && (
              <span className="breadcrumb__separator" aria-hidden="true">
                {separator}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;