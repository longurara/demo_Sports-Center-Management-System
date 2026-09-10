import type { ReactNode } from 'react';
import { Breadcrumb, Card, Space } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { flatNav } from '../routes';

interface Props {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
  children: ReactNode;
  noCard?: boolean;
}

function useCrumbs(title: string) {
  const { currentUser } = useApp();
  const { pathname } = useLocation();
  if (!currentUser) return [];
  const base = `/${currentUser.role.toLowerCase()}`;
  const items: { title: ReactNode }[] = [{ title: <Link to={base}><HomeOutlined /></Link> }];
  if (pathname === base) return items;
  const hit = flatNav(currentUser.role).filter((i) => i.key !== base && (pathname === i.key || pathname.startsWith(i.key + '/'))).sort((a, b) => b.key.length - a.key.length)[0];
  if (hit) {
    if (hit.section) items.push({ title: hit.section });
    if (pathname === hit.key) items.push({ title: hit.label });
    else { items.push({ title: <Link to={hit.key}>{hit.label}</Link> }); items.push({ title }); }
    return items;
  }
  items.push({ title });
  return items;
}

export default function Page({ title, subtitle, extra, children, noCard }: Props) {
  const crumbs = useCrumbs(title);
  return (
    <Space orientation="vertical" size={18} style={{ width: '100%' }} className="sc-page">
      <div className="sc-page-head">
        <Breadcrumb items={crumbs} style={{ fontSize: 12, marginBottom: 6 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="sc-page-title">{title}</h1>
            {subtitle && <div className="sc-page-subtitle" style={{ marginTop: 4 }}>{subtitle}</div>}
          </div>
          {extra && <div>{extra}</div>}
        </div>
      </div>
      {noCard ? children : <Card>{children}</Card>}
    </Space>
  );
}
