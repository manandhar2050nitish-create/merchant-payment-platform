--add the required roles
insert into roles(role) values ('ADMIN');
insert into roles(role) values ('SALES');
insert into roles(role) values ('REVIEWER');
commit;

--add the permissions
insert into permissions(role_id, permission) select id, 'ALL' from roles where role = 'ADMIN';
insert into permissions(role_id, permission) select id, 'VIEW' from roles where role = 'SALES';
insert into permissions(role_id, permission) select id, 'CREATE' from roles where role = 'SALES';
insert into permissions(role_id, permission) select id, 'UPDATE' from roles where role = 'SALES';
insert into permissions(role_id, permission) select id, 'LIST' from roles where role = 'SALES';
insert into permissions(role_id, permission) select id, 'SUBMIT' from roles where role = 'SALES';
insert into permissions(role_id, permission) select id, 'VIEW' from roles where role = 'REVIEWER';
insert into permissions(role_id, permission) select id, 'APPROVE' from roles where role = 'REVIEWER';
insert into permissions(role_id, permission) select id, 'REJECT' from roles where role = 'REVIEWER';
insert into permissions(role_id, permission) select id, 'REQUEST_INFO' from roles where role = 'REVIEWER';
commit;


insert into users (username, password, role_id)
select 'test_admin', '', id from roles where role = 'ADMIN';

insert into users (username, password, role_id)
select 'test_sales_1', '', id from roles where role = 'SALES';

insert into users (username, password, role_id)
select 'test_sales_2', '', id from roles where role = 'SALES';

insert into users (username, password, role_id)
select 'test_reviewer', '', id from roles where role = 'REVIEWER';

insert into users (username, password, role_id)
select 'test_reviewer_1', '', id from roles where role = 'REVIEWER';

commit;